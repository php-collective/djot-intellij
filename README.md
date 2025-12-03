# Djot IntelliJ Plugin

Djot markup language support for JetBrains IDEs (PhpStorm, IntelliJ IDEA, WebStorm, etc.).

## Features

- **Syntax highlighting** via TextMate grammar
- **Live preview** panel (split editor view)
- **Export to HTML**
- **Tool window** for standalone preview
- **File type** recognition for `.djot` files

## Requirements

- JetBrains IDE 2024.3+
- Java 17+
- For full preview: PHP with [djot-php](https://github.com/php-collective/djot-php) installed

## Building

```bash
./gradlew build
```

## Running (development)

```bash
./gradlew runIde
```

## Installation

1. Build the plugin: `./gradlew buildPlugin`
2. Install from disk: Settings → Plugins → ⚙️ → Install Plugin from Disk
3. Select `build/distributions/djot-intellij-*.zip`

## Usage

1. Open any `.djot` file
2. Editor opens in split view (editor + preview)
3. Preview updates live as you type
4. Right-click for "Export to HTML" option
5. Use `Ctrl+Shift+D` to toggle preview tool window

## Preview Rendering

The preview uses djot-php when available in the project. Fallback to basic regex-based conversion if PHP is not available.

For best results, add djot-php to your project:

```bash
composer require php-collective/djot-php
```

## About Djot

[Djot](https://djot.net) is a lightweight markup language created by John MacFarlane (creator of Pandoc). It improves on Markdown with:

- Consistent, unambiguous parsing rules
- Better syntax for highlights, super/subscript, attributes
- No backtracking required during parsing

## License

MIT

## Links

- [djot-php](https://github.com/php-collective/djot-php) - PHP implementation
- [Djot specification](https://htmlpreview.github.io/?https://github.com/jgm/djot/blob/master/doc/syntax.html)
- [djot.net](https://djot.net) - Official site
