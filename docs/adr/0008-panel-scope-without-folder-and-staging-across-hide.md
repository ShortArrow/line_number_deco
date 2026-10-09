# 8. The panel opens on User without a folder, and hiding it keeps staged values

Status: accepted

Date: 2026-10-08

## Context

The scope radio of the settings panel was baked into the html with Workspace checked. In a window with no folder open there are no Workspace settings to write: `updateWorkspaceConfig` rejects, and the rejection escaped the message handler without a word. Apply and Apply all in a fresh window therefore wrote nothing and said nothing, and the reader had no way to tell why the row kept its old value.

Hiding the view, by switching the sidebar to Explorer for example, cleared every staged value. Hiding is how a reader checks the editor behind the panel, or goes to look at a file, and the staged colors and switches were gone when they came back.

## Decision

When `vscode.workspace.workspaceFolders` is undefined or empty, the Workspace radio is disabled, with the title "Open a folder to edit Workspace settings", and the panel opens on User. A scope of `workspace` remembered in the webview state falls back to User in that case. With a folder open, the panel behaves as before. The extension listens to `onDidChangeWorkspaceFolders` and its state message carries `hasWorkspace`, so the radio follows a folder being opened or closed while the panel is showing.

Hiding the view no longer clears staged values; they keep applying to the editors while the view is hidden. Disposing the view still clears them.

## Alternatives

Switching the radio to User when an Apply finds no folder would have saved the write, but it would also have moved the reader's choice without asking, so a later Apply in a window that had gained a folder would land somewhere the reader had not picked.

Keeping Workspace selectable and showing an error when the write fails tells the reader what went wrong only after they have made the choice that cannot work. A disabled radio with a title says it before the click.

Clearing staged values on hide kept the editors honest about what was saved, but a reader who hides the view has not decided to discard anything. Reset and Reset all remain the way to discard.

## Consequences

A fresh window writes to User settings out of the box. The staged values outlive a hidden view, so the webview has to be given them again on every show; it already asks with a ready message whenever its iframe is recreated. The editors can show a staged color while the panel is not visible, and the row's marker explains it once the panel is shown again.
