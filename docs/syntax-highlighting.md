# Syntax Highlighting

This document explains how syntax highlighting works in the Djot IntelliJ plugin.

## Overview

The plugin uses a **two-layer approach** for syntax highlighting:

1. **Editor highlighting**: TextMate grammar for the code editor
2. **Preview highlighting**: highlight.js for code blocks in the rendered preview

## TextMate Grammar

The grammar is defined in `src/main/resources/textmate/djot.tmLanguage.json` and follows the [TextMate Language Grammar](https://macromates.com/manual/en/language_grammars) specification.

> **Note:** This grammar is shared with [djot-grammars](https://github.com/php-collective/djot-grammars), which packages the same grammar for use with other tools (Shiki, Phiki, VS Code) along with highlight.js and Prism.js grammars.

### How It Works

IntelliJ IDEs have built-in TextMate support. The plugin registers a TextMate bundle via:

- `textmate/package.json` - Declares the grammar file and scope name
- `textmate/language-configuration.json` - Defines brackets and auto-closing pairs
- `textmate/djot.tmLanguage.json` - The actual grammar rules

When a `.djot` file is opened, IntelliJ applies the grammar patterns to tokenize the text and assign scope names. These scopes map to the IDE's color scheme.

### Scope Naming Conventions

Scopes follow TextMate conventions with `.djot` suffix:

| Category | Scope | Djot Syntax |
|----------|-------|-------------|
| **Headings** | `markup.heading.djot` | `# Heading` |
| **Bold** | `markup.bold.djot` | `*bold*` |
| **Italic** | `markup.italic.djot` | `_italic_` |
| **Code (inline)** | `markup.raw.inline.code.djot` | `` `code` `` |
| **Code (block)** | `markup.raw.code.fenced.djot` | ` ``` ` |
| **Links** | `markup.underline.link.djot` | `[text](url)` |
| **Images** | `markup.underline.link.image.djot` | `![alt](url)` |
| **Blockquotes** | `markup.quote.djot` | `> quote` |
| **Lists** | `keyword.operator.list.marker.djot` | `- item` |
| **Tables** | `markup.table.row.djot` | `\| cell \|` |
| **Math** | `markup.math.inline.djot` | `$\`x\`$` |
| **Highlight** | `markup.changed.highlight.djot` | `{=text=}` |
| **Insert** | `markup.inserted.djot` | `{+text+}` |
| **Delete** | `markup.deleted.djot` | `{-text-}` |
| **Superscript** | `markup.superscript.djot` | `^text^` |
| **Subscript** | `markup.subscript.djot` | `~text~` |
| **Comments** | `comment.block.djot` | `{% comment %}` |
| **Footnotes** | `constant.other.footnote.djot` | `[^ref]` |
| **Attributes** | `entity.other.attribute.djot` | `{.class #id}` |

### Pattern Organization

The grammar is organized into two main sections:

#### Top-Level Patterns

These are matched in order at the document level:

```
frontmatter → comment-block → comment-fenced → heading →
codeblock-raw → codeblock → math-display → blockquote →
div → line-block → definition-list → list → thematic-break →
table → reference-definition → footnote-definition →
abbreviation-definition → caption → block-attribute → paragraph
```

#### Repository (Reusable Patterns)

The `repository` section contains reusable pattern definitions. Key groups:

- **Block patterns**: `heading`, `codeblock`, `blockquote`, `div`, `list`, `table`
- **Inline patterns**: `#inline` includes all inline elements
- **Attributes**: `#attribute-content` for parsing `{.class #id key=value}`

### Pattern Types

TextMate grammars support several pattern types:

#### Match Patterns

Single-line patterns using `match`:

```json
{
  "match": "^(#{1,6})\\s+(.*)$",
  "captures": {
    "1": { "name": "punctuation.definition.heading.djot" },
    "2": { "name": "markup.heading.djot" }
  }
}
```

#### Begin/End Patterns

Multi-line patterns using `begin` and `end`:

```json
{
  "begin": "^(`{3,})([a-zA-Z0-9_+-]*)?",
  "end": "^(`{3,})\\s*$",
  "contentName": "markup.raw.code.fenced.djot"
}
```

#### Include Patterns

Reference other patterns from the repository:

```json
{ "include": "#inline" }
```

## Adding New Syntax Elements

### Step 1: Identify the Pattern Type

- **Block-level**: Starts at beginning of line, may span multiple lines
- **Inline**: Appears within text, typically single-line

### Step 2: Choose a Scope Name

Follow TextMate naming conventions:

- `markup.*` - Formatting (bold, italic, headings)
- `keyword.*` - Structural markers (list bullets, operators)
- `string.*` - Quoted content
- `constant.*` - Symbols, escape sequences
- `entity.*` - References, attributes
- `punctuation.*` - Delimiters
- `comment.*` - Comments

### Step 3: Write the Pattern

Add to the appropriate section:

- Block patterns: Add to top-level `patterns` array
- Inline patterns: Add to `#inline` in repository
- Reusable patterns: Add to `repository`

### Step 4: Test the Changes

```bash
cd tests
npm install
npm test
```

Or manually test with:

```bash
./gradlew runIde
```

## Testing

### Automated Tests

The `tests/` directory contains JavaScript-based grammar tests:

- `test-grammar.mjs` - General pattern tests
- `test-emphasis.mjs` - Emphasis edge cases
- `test-highlight.mjs` - Highlight/insert/delete
- `test-thematic.mjs` - Thematic breaks
- `edge-cases.mjs` - Complex nesting scenarios

Run tests:

```bash
cd tests
npm install
npm test
```

### Manual Testing

1. Build and run in sandbox IDE:
   ```bash
   ./gradlew runIde
   ```

2. Open files from `examples/` directory

3. Verify syntax highlighting appears correctly

## Common Pitfalls

### Regex Escaping

JSON requires double escaping:
- `\s` becomes `\\s`
- `\[` becomes `\\[`
- Literal backslash `\\` becomes `\\\\`

### Pattern Ordering

Patterns are matched in order. More specific patterns should come before general ones:

```json
// Correct: raw code block before regular code block
{ "include": "#codeblock-raw" },
{ "include": "#codeblock" }
```

### Greedy Matching

Use lazy quantifiers (`+?`, `*?`) for inline patterns to avoid over-matching:

```json
// Good: lazy match
"match": "(`+)(.+?)(\\1)"

// Bad: greedy match (may consume too much)
"match": "(`+)(.+)(\\1)"
```

### Nested Patterns

For elements that can contain other inline elements, include the `#inline` pattern:

```json
{
  "begin": "(\\*)",
  "end": "(\\*)",
  "name": "markup.bold.djot",
  "patterns": [
    { "include": "#inline" }
  ]
}
```

### Preventing Unwanted Nesting

Some elements shouldn't nest (like divs). Use a separate content pattern that excludes the parent:

```json
"div": {
  "begin": "^(:{3,})",
  "end": "^(:{3,})",
  "patterns": [
    { "include": "#div-content" }  // Not $self!
  ]
}
```

## Preview Code Highlighting

Code blocks in the preview panel use [highlight.js](https://highlightjs.org/) for syntax coloring. This is separate from the TextMate grammar and happens during HTML rendering via djot.js.

The preview implementation is in `src/main/kotlin/org/phpcollective/djot/preview/DjotPreviewPanel.kt`.

## Resources

- [TextMate Language Grammars](https://macromates.com/manual/en/language_grammars)
- [VS Code Syntax Highlighting Guide](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide)
- [Djot Syntax Reference](https://djot.net/syntax/)
- [highlight.js](https://highlightjs.org/)
- [djot-grammars](https://github.com/php-collective/djot-grammars) - Shared grammar repository
