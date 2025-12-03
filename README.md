# Djot IntelliJ Plugin

Djot markup language support for JetBrains IDEs (PhpStorm, IntelliJ IDEA, WebStorm, etc.).

## Features

- **Syntax highlighting** via TextMate grammar
- **Live preview** panel (split editor view)
- **Export to HTML**
- **Tool window** for standalone preview
- **File type** recognition for `.djot` files

## Requirements

- JetBrains IDE 2024.1+
- Java 17+

## Building

```bash
./gradlew build
```

## Running (development)

```bash
./gradlew runIde
```

## Installation

### From JetBrains Marketplace (coming soon)

Settings → Plugins → Marketplace → Search "Djot"

### From Disk (manual)

1. Download the latest release from [GitHub Releases](https://github.com/php-collective/djot-intellij/releases), or build it yourself:
   ```bash
   ./gradlew buildPlugin
   ```
2. In your IDE: Settings → Plugins → ⚙️ → Install Plugin from Disk
3. Select the `djot-intellij-*.zip` file (in `build/distributions/` if built locally)
4. Restart the IDE

## Usage

1. Open any `.djot` file
2. Editor opens in split view (editor + preview)
3. Preview updates live as you type
4. Right-click for "Export to HTML" option
5. Use `Ctrl+Shift+D` to toggle preview tool window

## Preview Rendering

The preview uses [djot.js](https://github.com/jgm/djot.js) (loaded from CDN) for accurate Djot rendering. Falls back to a basic regex-based conversion if the CDN is unreachable.

## About Djot

[Djot](https://djot.net) is a lightweight markup language created by John MacFarlane (creator of Pandoc). It improves on Markdown with:

- Consistent, unambiguous parsing rules
- Better syntax for highlights, super/subscript, attributes
- No backtracking required during parsing

## License

MIT

## Links

- [Djot specification](https://htmlpreview.github.io/?https://github.com/jgm/djot/blob/master/doc/syntax.html)
- [djot.net](https://djot.net) - Official site
- [djot-php](https://github.com/php-collective/djot-php) - PHP implementation
