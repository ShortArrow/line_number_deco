# Settings

Every configuration key of the extension. All of them are also editable from the settings panel in the activity bar.

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| `LineNumberDeco.enableRelativeLine` | boolean | `true` | Show relative line numbers |
| `LineNumberDeco.centerColorOfRainbow` | color | `#0000ff` | Color at the center of the rainbow, on the current line |
| `LineNumberDeco.foregroundColorOfRepeatingDigits` | color | (theme color) | Color of repeating-digit line numbers (11, 22, 333); empty uses the theme color |
| `LineNumberDeco.foregroundColorOfSequentialDigits` | color | (theme color) | Color of sequential-digit line numbers (123, 543, 10); empty uses the theme color |
| `LineNumberDeco.foregroundColorOfMultiplesOfFive` | color | (theme color) | Color of line numbers at multiples of five (5, 10, 15); empty uses the theme color |
| `LineNumberDeco.enableRainbow` | boolean | `false` | Color each line number by its distance from the cursor |
| `LineNumberDeco.enableRepeatingDigits` | boolean | `false` | Give repeating-digit line numbers (11, 22, 333) their own color |
| `LineNumberDeco.enableSequentialDigits` | boolean | `false` | Give sequential-digit line numbers (123, 543, 10) their own color — the poker mode |
| `LineNumberDeco.enableMultiplesOfFive` | boolean | `false` | Give line numbers at multiples of five (5, 10, 15) their own color |
| `LineNumberDeco.activeForeground` | color | (theme color) | Color of the current line's number; empty uses the theme color |
| `LineNumberDeco.foreground` | color | (theme color) | Color of the other line numbers; empty uses the theme color |
| `LineNumberDeco.enableDiagnostics` | boolean | `false` | Color line numbers on lines with errors or warnings |
| `LineNumberDeco.errorForeground` | color | (theme color) | Color of line numbers on error lines; empty uses the theme color |
| `LineNumberDeco.warningForeground` | color | (theme color) | Color of line numbers on warning lines; empty uses the theme color |
