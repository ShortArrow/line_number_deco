# Staging and applying in the settings panel

The settings panel lets a value be tried before it is written. A value chosen in the panel is staged: the editors render it at once, but nothing reaches the configuration until Apply or Apply all writes it. This document states what the panel holds, what each control does to it, and the invariants the implementation keeps. `src/test/panelStaging.test.ts` checks the invariants I1 to I4 against every short sequence of operations.

## State

Each key the panel offers (a color, a switch, or the editor's `editor.lineNumbers`) has three pieces of state.

| Name | Where it lives | What it is |
| --- | --- | --- |
| `saved[scope][k]` | VS Code's configuration, per scope (user, workspace) | The value written to that scope, or nothing |
| `staged[k]` | The extension's preview store, `src/preview.ts` | The value chosen in the panel and not yet applied, or nothing |
| display | The webview | What the row shows |

`staged` is the single source of truth for unapplied values. The webview holds a copy of it and the saved values of both scopes, and draws each row from those copies. The config getters read `staged[k]` before the configuration, so the editors render a staged color or switch while it is staged. The editor draws its own line numbers, so a staged `editor.lineNumbers` changes nothing until it is applied.

The scope radio at the top of the panel selects which scope the rows show and where Apply writes. With no folder open, the Workspace radio is disabled and the panel opens on User; a scope remembered from an earlier session falls back to User in that case. Opening or closing a folder while the panel is showing enables or disables the radio through the next state message.

## Operations

| Operation | Effect on the state |
| --- | --- |
| stage(k, v) | `staged[k] = v` |
| reset(k) | `staged[k]` is removed |
| reset all | Every staged value is removed |
| apply(k, scope) | If k is staged, its value is written to `saved[scope][k]` |
| apply all(scope) | Every key staged at the click is written to `saved[scope]` |
| flip scope | The rows show the other scope's saved values; nothing is written |
| hide or show the view | Nothing changes; staged values keep applying to the editors while the view is hidden |
| close the view | Every staged value is removed |
| a save completes | If `staged[k]` still holds the value that was written, it is removed |
| a save fails | `staged[k]` is left as it is and an error names the key |

Apply for a key that is not staged writes nothing. An apply that arrives while a save of the same key is still in flight writes nothing either, and the key stays staged; the webview never sends one, because the row's Apply is disabled for that time.

## Invariants

These hold after every operation, once every save that was in flight has settled.

- **I1.** When apply(k) succeeds, `saved[scope][k]` equals the value k had when Apply was clicked.
- **I2.** Nothing is written for a key that was not staged when its Apply or Apply all was clicked.
- **I3.** A value staged after an Apply or Apply all started is never lost. Either its own Apply saves it, or it is still staged.
- **I4.** A failed save leaves its key staged with its value, and `vscode.window.showErrorMessage` names the key. Within one Apply all, each key is saved or left staged on its own, whatever happens to the others.
- **I5.** When no messages are in flight, the webview shows `staged[k] ?? saved[selectedScope][k]` for every row, and its copy of the staged values equals the extension's.
- **I6.** While a row's save is in flight, including as part of Apply all, that row's Apply is disabled, and Apply all is disabled while any save is in flight. Each re-enables when the state message posted after its save arrives.

## How the extension keeps them

`handlePanelMessage` in `src/panel.ts` removes a key from `staged` only after its save has succeeded, and only if the staged value is still the one that was written (compare-and-clear). Apply all takes a snapshot of `staged` when it starts and saves each key in the snapshot on its own, so a value staged during the saves is outside the snapshot and survives. A rejected save is caught, reported with `showErrorMessage`, and leaves the key staged. These rules alone keep I1 to I4 under any interleaving of messages and save completions.

The provider additionally handles the webview's messages one at a time, through a single promise chain, so in practice no two handlers interleave. Every message except a color or switch preview is answered with a state message once its handler has finished.

## How the webview keeps them

Every message the webview posts carries the id of the webview instance and a sequence number that increases with each message. Every state message carries the instance id and sequence number of the last message the extension finished handling, its acknowledgement. The webview keeps its own edits (a stage, a reset) that have not been acknowledged yet and lays them over the staged values a state message carries; an edit is dropped once a state message acknowledges a number at or past its own. A state message posted before the extension has seen an edit therefore cannot erase that edit. The instance id keeps a reloaded webview, whose numbering starts again, from mistaking the previous instance's acknowledgements for its own.

Clicking Apply marks the row busy with the click's sequence number, and Apply all marks every staged row and the Apply all button. A busy button is disabled, and a mark is removed by the first state message that acknowledges its number.

A hex field the reader has focus in is rewritten only when the value its row shows changes, for example after a reset. A state message that carries the value the field already shows leaves the field and its caret alone.
