# Contributing to Djot IntelliJ Plugin

Thank you for your interest in contributing!

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/php-collective/djot-intellij.git
   cd djot-intellij
   ```

2. Build and run in a sandbox IDE:
   ```bash
   ./gradlew runIde
   ```

3. Build the plugin:
   ```bash
   ./gradlew buildPlugin
   ```

## Project Structure

```
src/main/
├── kotlin/org/phpcollective/djot/
│   ├── DjotLanguage.kt          # Language definition
│   ├── DjotFileType.kt          # File type registration
│   ├── DjotParserDefinition.kt  # Minimal parser
│   ├── DjotTextMateBundleProvider.kt
│   ├── actions/                 # Editor actions
│   └── preview/                 # Preview panel
└── resources/
    ├── META-INF/plugin.xml      # Plugin configuration
    ├── icons/                   # Plugin icons
    └── textmate/                # TextMate grammar
```

## Making Changes

### TextMate Grammar

The syntax highlighting is defined in `src/main/resources/textmate/djot.tmLanguage.json`.
See the [TextMate Grammar Guide](https://macromates.com/manual/en/language_grammars) for documentation.

### Preview Panel

The preview uses [djot.js](https://github.com/jgm/djot.js) loaded from CDN for rendering.
The implementation is in `src/main/kotlin/org/phpcollective/djot/preview/DjotPreviewPanel.kt`.

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `./gradlew runIde`
5. Submit a pull request

## Code Style

- Follow Kotlin coding conventions
- Use 4 spaces for indentation
- Run `./gradlew check` before submitting

## Reporting Issues

Please report issues on the [GitHub issue tracker](https://github.com/php-collective/djot-intellij/issues).

Include:
- IDE version
- Plugin version
- Steps to reproduce
- Expected vs actual behavior
