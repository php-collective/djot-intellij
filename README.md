# Djot IntelliJ Plugin

[![JetBrains Marketplace](https://img.shields.io/jetbrains/plugin/v/29244-djot.svg)](https://plugins.jetbrains.com/plugin/29244-djot)
[![Downloads](https://img.shields.io/jetbrains/plugin/d/29244-djot.svg)](https://plugins.jetbrains.com/plugin/29244-djot)

Djot markup language support for JetBrains IDEs (PhpStorm, IntelliJ IDEA, WebStorm, etc.).

## Features

- **Syntax highlighting** via TextMate grammar
- **Live preview** panel (split editor view)
- **IDE theme sync** - preview follows dark/light mode
- **Code highlighting** - syntax highlighting in code blocks (highlight.js)
- **Export to HTML** - full Djot rendering via embedded djot.js
- **Live Templates** - code snippets for common Djot patterns
- **Tool window** for standalone preview
- **File type** recognition for `.djot` files

## Requirements

- JetBrains IDE 2024.1+
- Java 17+

## Installation

### From JetBrains Marketplace

1. In your IDE: **Settings → Plugins → Marketplace**
2. Search for **"Djot"**
3. Click **Install**

Or install directly: [JetBrains Marketplace](https://plugins.jetbrains.com/plugin/29244-djot)

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

## Live Templates

Type a prefix and press `Tab` to expand. Available templates:

| Prefix                            | Description                       |
|-----------------------------------|-----------------------------------|
| `djh1`-`djh6`                     | Headings                          |
| `djb`, `dji`, `djc`               | Bold, italic, code                |
| `djhi`, `djsup`, `djsub`          | Highlight, superscript, subscript |
| `djins`, `djdel`                  | Insert, delete                    |
| `djlink`, `djlinkref`, `djimg`    | Links and images                  |
| `djcode`, `djraw`                 | Code blocks                       |
| `djquote`, `djdiv`, `djhr`        | Blockquote, div, horizontal rule  |
| `djul`, `djol`, `djtask`, `djdef` | Lists                             |
| `djtable`                         | Table                             |
| `djfn`, `djfndef`                 | Footnotes                         |
| `djmath`, `djmathblock`           | Math                              |
| `djattr`, `djid`, `djspan`        | Attributes                        |
| `djfront`                         | YAML frontmatter                  |
| `djcomment`                       | Comment block                     |

## Preview Rendering

The preview uses [djot.js](https://github.com/jgm/djot.js) (loaded from CDN) for accurate Djot rendering with:
- Code syntax highlighting (highlight.js)
- IDE theme synchronization (dark/light)
- Task list checkboxes
- Full Djot feature support

## About Djot

[Djot](https://djot.net) is a lightweight markup language created by John MacFarlane (creator of Pandoc). It improves on Markdown with:

- Consistent, unambiguous parsing rules
- Better syntax for highlights, super/subscript, attributes
- No backtracking required during parsing

## Links

- [Djot specification](https://htmlpreview.github.io/?https://github.com/jgm/djot/blob/master/doc/syntax.html)
- [djot.net](https://djot.net) - Official site
- [djot-php](https://github.com/php-collective/djot-php) - PHP implementation

## Development

### Building

```bash
./gradlew build
```

### Running (development)

```bash
./gradlew runIde
```
