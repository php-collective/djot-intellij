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
├── docs/                        # Documentation
│   └── syntax-highlighting.md   # How syntax highlighting works
├── src/main/
│   ├── kotlin/org/phpcollective/djot/
│   │   ├── DjotLanguage.kt          # Language definition
│   │   ├── DjotFileType.kt          # File type registration
│   │   ├── DjotParserDefinition.kt  # Minimal parser
│   │   ├── DjotTextMateBundleProvider.kt
│   │   ├── actions/                 # Editor actions
│   │   └── preview/                 # Preview panel
│   └── resources/
│       ├── META-INF/plugin.xml      # Plugin configuration
│       ├── icons/                   # Plugin icons
│       └── textmate/                # TextMate grammar
└── tests/                       # Grammar tests (JavaScript)
```

## Making Changes

### TextMate Grammar

The syntax highlighting is defined in `src/main/resources/textmate/djot.tmLanguage.json`.

> **Note:** This grammar is shared with [djot-grammars](https://github.com/php-collective/djot-grammars), which provides the same TextMate grammar plus additional formats (highlight.js, Prism.js) for use with Shiki, Phiki, and other highlighters. When making changes, ensure both repositories stay in sync.

For detailed documentation on how the grammar works, scope naming conventions, and how to add new syntax elements, see [docs/syntax-highlighting.md](docs/syntax-highlighting.md).

### Preview Panel

The preview uses [djot.js](https://github.com/jgm/djot.js) loaded from CDN for rendering.
The implementation is in `src/main/kotlin/org/phpcollective/djot/preview/DjotPreviewPanel.kt`.

## Testing

### Plugin Testing

Build and run in a sandbox IDE:

```bash
./gradlew runIde
```

### Grammar Tests

The `tests/` directory contains JavaScript tests for the TextMate grammar:

```bash
cd tests
npm install
npm test
```

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `./gradlew runIde` and `npm test` (in tests/)
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
