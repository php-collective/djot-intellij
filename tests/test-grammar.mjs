import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import vsctmModule from 'vscode-textmate';
import oniguruma from 'vscode-oniguruma';

const vsctm = vsctmModule.default || vsctmModule;

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load oniguruma WASM
const wasmBin = readFileSync(resolve(__dirname, 'node_modules/vscode-oniguruma/release/onig.wasm'));
const vscodeOnigurumaLib = oniguruma.loadWASM(wasmBin).then(() => {
  return {
    createOnigScanner(patterns) { return new oniguruma.OnigScanner(patterns); },
    createOnigString(s) { return new oniguruma.OnigString(s); }
  };
});

// Load grammar
const grammarPath = resolve(__dirname, '../src/main/resources/textmate/djot.tmLanguage.json');
const grammarContent = JSON.parse(readFileSync(grammarPath, 'utf-8'));

const registry = new vsctm.Registry({
  onigLib: vscodeOnigurumaLib,
  loadGrammar: async (scopeName) => {
    if (scopeName === 'text.djot') {
      return grammarContent;
    }
    return null;
  }
});

// Test cases: [input, expected scopes for specific tokens]
const testCases = [
  // ==================== HEADINGS ====================
  {
    name: 'Heading level 1',
    input: '# Heading 1',
    expects: [
      { token: '#', scope: 'markup.heading.marker.djot' },
      { token: 'Heading 1', scope: 'markup.heading.djot' },
    ]
  },
  {
    name: 'Heading level 6',
    input: '###### Heading 6',
    expects: [
      { token: '######', scope: 'markup.heading.marker.djot' },
    ]
  },

  // ==================== STRONG AND EMPHASIS ====================
  {
    name: 'Strong text',
    input: 'This is *strong* text',
    expects: [
      { token: '*', scope: 'punctuation.definition.bold' },
      { token: 'strong', scope: 'markup.bold.djot' },
    ]
  },
  {
    name: 'Emphasis text',
    input: 'This is _emphasized_ text',
    expects: [
      { token: '_', scope: 'punctuation.definition.italic' },
      { token: 'emphasized', scope: 'markup.italic.djot' },
    ]
  },
  {
    name: 'Nested emphasis in strong',
    input: '*_nested_*',
    expects: [
      { token: '*', scope: 'punctuation.definition.bold' },
      { token: '_', scope: 'punctuation.definition.italic' },
    ]
  },
  {
    name: 'Strong at start of line',
    input: '*strong* at start',
    expects: [
      { token: 'strong', scope: 'markup.bold.djot' },
    ]
  },

  // ==================== CODE BLOCKS ====================
  {
    name: 'Fenced code block with language',
    input: '```php\ncode\n```',
    expects: [
      { token: '```', scope: 'string.other.begin.code.fence.djot' },
      { token: 'php', scope: 'entity.name.function.language.djot' },
    ]
  },
  {
    name: 'Fenced code block without language',
    input: '```\ncode\n```',
    expects: [
      { token: '```', scope: 'string.other.begin.code.fence.djot' },
    ]
  },
  {
    name: 'Raw code block with =html',
    input: '``` =html\n<div>\n```',
    expects: [
      { token: '```', scope: 'string.other.begin.code.fence.djot' },
      { token: '=', scope: 'keyword.operator.raw.djot' },
      { token: 'html', scope: 'entity.name.type.format.djot' },
    ]
  },
  {
    name: 'Raw code block with =latex',
    input: '``` =latex\n\\begin{}\n```',
    expects: [
      { token: '=', scope: 'keyword.operator.raw.djot' },
      { token: 'latex', scope: 'entity.name.type.format.djot' },
    ]
  },
  // NOTE: Code block with inline attributes not yet implemented

  // ==================== INLINE CODE ====================
  {
    name: 'Inline code',
    input: 'Use `print()` function',
    expects: [
      { token: '`', scope: 'string.other.begin.code.djot' },
      { token: 'print()', scope: 'markup.raw.inline.code.djot' },
    ]
  },
  // NOTE: Double backtick inline code not yet implemented
  {
    name: 'Raw inline with format',
    input: '`<b>raw</b>`{=html}',
    expects: [
      { token: '`', scope: 'string.other.begin.code.djot' },
      { token: '{=', scope: 'keyword.operator.raw.djot' },
      { token: 'html', scope: 'entity.name.type.format.djot' },
    ]
  },

  // ==================== COMMENTS ====================
  {
    name: 'Inline comment',
    input: 'Text {% comment %} more',
    expects: [
      { token: '{%', scope: 'punctuation.definition.comment.begin.djot' },
      { token: '%}', scope: 'punctuation.definition.comment.end.djot' },
    ]
  },
  {
    name: 'Fenced comment %%%',
    input: '%%%\ncomment\n%%%',
    expects: [
      { token: '%%%', scope: 'punctuation.definition.comment.begin.djot' },
    ]
  },
  {
    name: 'Fenced comment with 4 percent signs',
    input: '%%%%\ncomment with %%% inside\n%%%%',
    expects: [
      { token: '%%%%', scope: 'punctuation.definition.comment.begin.djot' },
    ]
  },

  // ==================== TASK LISTS ====================
  {
    name: 'Task list - checked with x',
    input: '- [x] Done',
    expects: [
      { token: '-', scope: 'keyword.operator.list.marker.djot' },
      { token: '[x]', scope: 'markup.inserted.checkbox.checked.djot' },
    ]
  },
  {
    name: 'Task list - checked with X',
    input: '- [X] Also done',
    expects: [
      { token: '[X]', scope: 'markup.inserted.checkbox.checked.djot' },
    ]
  },
  {
    name: 'Task list - unchecked with space',
    input: '- [ ] Todo',
    expects: [
      { token: '[ ]', scope: 'markup.deleted.checkbox.unchecked.djot' },
    ]
  },
  {
    name: 'Task list - unchecked with underscore',
    input: '- [_] Also todo',
    expects: [
      { token: '[_]', scope: 'markup.deleted.checkbox.unchecked.djot' },
    ]
  },
  {
    name: 'Ordered task list',
    input: '1. [x] First done',
    expects: [
      { token: '1.', scope: 'keyword.operator.list.marker.djot' },
      { token: '[x]', scope: 'markup.inserted.checkbox.checked.djot' },
    ]
  },

  // ==================== LISTS ====================
  {
    name: 'Unordered list with dash',
    input: '- Item',
    expects: [
      { token: '-', scope: 'keyword.operator.list.marker.djot' },
    ]
  },
  {
    name: 'Unordered list with asterisk',
    input: '* Item',
    expects: [
      { token: '*', scope: 'keyword.operator.list.marker.djot' },
    ]
  },
  {
    name: 'Unordered list with plus',
    input: '+ Item',
    expects: [
      { token: '+', scope: 'keyword.operator.list.marker.djot' },
    ]
  },
  {
    name: 'Ordered list with dot',
    input: '1. First',
    expects: [
      { token: '1.', scope: 'keyword.operator.list.marker.djot' },
    ]
  },
  {
    name: 'Ordered list with parenthesis',
    input: '1) First',
    expects: [
      { token: '1)', scope: 'keyword.operator.list.marker.djot' },
    ]
  },

  // ==================== BLOCKQUOTES ====================
  {
    name: 'Blockquote',
    input: '> Quote text',
    expects: [
      { token: '>', scope: 'keyword.operator.blockquote.djot' },
    ]
  },

  // ==================== DIVS ====================
  {
    name: 'Div with class',
    input: '::: warning\ncontent\n:::',
    expects: [
      { token: ':::', scope: 'keyword.control.div.begin.djot' },
      { token: 'warning', scope: 'entity.name.tag.div.djot' },
    ]
  },
  {
    name: 'Div with attributes',
    input: '::: note {.important}\ncontent\n:::',
    expects: [
      { token: ':::', scope: 'keyword.control.div.begin.djot' },
      { token: 'note', scope: 'entity.name.tag.div.djot' },
    ]
  },
  {
    name: 'Div with 4 colons',
    input: ':::: outer\n::: inner\n:::\n::::',
    expects: [
      { token: '::::', scope: 'keyword.control.div.begin.djot' },
    ]
  },

  // ==================== TABLES ====================
  {
    name: 'Table row',
    input: '| A | B |',
    expects: [
      { token: '|', scope: 'keyword.operator.table.pipe.djot' },
    ]
  },
  {
    name: 'Table separator',
    input: '|---|---|',
    expects: [
      { token: '|---|---|', scope: 'punctuation.definition.table.separator.djot' },
    ]
  },
  {
    name: 'Table with alignment',
    input: '|:--|:--:|--:|',
    expects: [
      { token: '|:--|:--:|--:|', scope: 'punctuation.definition.table.separator.djot' },
    ]
  },

  // ==================== LINE BLOCKS ====================
  {
    name: 'Line block (poetry)',
    input: '| Roses are red',
    expects: [
      { token: '|', scope: 'keyword.operator.line-block.djot' },
    ]
  },

  // ==================== DEFINITION LISTS ====================
  {
    name: 'Definition list - definition line',
    input: ': Definition here',
    expects: [
      { token: ':', scope: 'keyword.operator.definition.djot' },
    ]
  },

  // ==================== CAPTIONS ====================
  {
    name: 'Caption',
    input: '^ Caption text',
    expects: [
      { token: '^', scope: 'punctuation.definition.caption.djot' },
      { token: 'Caption text', scope: 'markup.italic.caption.djot' },
    ]
  },

  // ==================== LINKS ====================
  {
    name: 'Inline link',
    input: '[text](https://example.com)',
    expects: [
      { token: '[', scope: 'punctuation.definition.link.begin.djot' },
      { token: 'text', scope: 'string.other.link.title.djot' },
      { token: ']', scope: 'punctuation.definition.link.end.djot' },
      { token: 'https://example.com', scope: 'markup.underline.link.djot' },
    ]
  },
  {
    name: 'Reference link',
    input: '[text][ref]',
    expects: [
      { token: '[', scope: 'punctuation.definition.link.begin.djot' },
      { token: 'ref', scope: 'entity.name.reference.djot' },
    ]
  },
  // NOTE: Shortcut reference link [ref][] not yet implemented
  {
    name: 'Reference definition',
    input: '[ref]: https://example.com',
    expects: [
      { token: '[', scope: 'punctuation.definition.reference.begin.djot' },
      { token: 'ref', scope: 'entity.name.reference.djot' },
      { token: ':', scope: 'punctuation.separator.definition.djot' },
      { token: 'https://example.com', scope: 'markup.underline.link.djot' },
    ]
  },
  {
    name: 'Autolink URL',
    input: '<https://example.com>',
    expects: [
      { token: '<', scope: 'punctuation.definition.autolink.begin.djot' },
      { token: 'https://example.com', scope: 'markup.underline.link.autolink.djot' },
    ]
  },
  {
    name: 'Autolink email',
    input: '<user@example.com>',
    expects: [
      { token: 'user@example.com', scope: 'markup.underline.link.autolink.djot' },
    ]
  },

  // ==================== IMAGES ====================
  {
    name: 'Image',
    input: '![alt text](image.png)',
    expects: [
      { token: '!', scope: 'punctuation.definition.image.marker.djot' },
      { token: '[', scope: 'punctuation.definition.image.begin.djot' },
      { token: 'alt text', scope: 'string.other.image.alt.djot' },
      { token: 'image.png', scope: 'markup.underline.link.image.djot' },
    ]
  },

  // ==================== FOOTNOTES ====================
  {
    name: 'Footnote reference',
    input: 'Text[^1] here',
    expects: [
      { token: '[^', scope: 'punctuation.definition.footnote.begin.djot' },
      { token: '1', scope: 'constant.other.footnote.reference.djot' },
    ]
  },
  {
    name: 'Footnote definition',
    input: '[^1]: Footnote content',
    expects: [
      { token: '[^', scope: 'punctuation.definition.footnote.begin.djot' },
      { token: '1', scope: 'entity.name.footnote.djot' },
      { token: ':', scope: 'punctuation.separator.definition.djot' },
    ]
  },
  {
    name: 'Named footnote',
    input: '[^note]: Named footnote',
    expects: [
      { token: 'note', scope: 'entity.name.footnote.djot' },
    ]
  },

  // ==================== ABBREVIATIONS ====================
  {
    name: 'Abbreviation definition',
    input: '*[HTML]: Hyper Text Markup Language',
    expects: [
      { token: '*[', scope: 'punctuation.definition.abbreviation.begin.djot' },
      { token: 'HTML', scope: 'entity.name.abbreviation.djot' },
      { token: ']', scope: 'punctuation.definition.abbreviation.end.djot' },
      { token: ':', scope: 'punctuation.separator.definition.djot' },
    ]
  },

  // ==================== THEMATIC BREAKS ====================
  {
    name: 'Thematic break with asterisks',
    input: '***',
    expects: [
      { token: '***', scope: 'keyword.control.thematic-break.djot' },
    ]
  },
  {
    name: 'Thematic break with dashes',
    input: 'text\n\n---',
    expects: [
      { token: '---', scope: 'keyword.control.thematic-break.djot' },
    ]
  },
  {
    name: 'Thematic break with underscores',
    input: '___',
    expects: [
      { token: '___', scope: 'keyword.control.thematic-break.djot' },
    ]
  },
  {
    name: 'Long thematic break',
    input: '*****',
    expects: [
      { token: '*****', scope: 'keyword.control.thematic-break.djot' },
    ]
  },

  // ==================== SPANS ====================
  {
    name: 'Span with class',
    input: '[text]{.highlight}',
    expects: [
      { token: '[', scope: 'punctuation.definition.span.begin.djot' },
      { token: 'text', scope: 'markup.span.djot' },
      { token: '{', scope: 'punctuation.definition.attribute.begin.djot' },
    ]
  },
  {
    name: 'Span with ID',
    input: '[text]{#unique}',
    expects: [
      { token: 'text', scope: 'markup.span.djot' },
    ]
  },

  // ==================== HIGHLIGHT, INSERT, DELETE ====================
  {
    name: 'Highlight',
    input: '{=highlighted=}',
    expects: [
      { token: '{=', scope: 'punctuation.definition.highlight.begin.djot' },
      { token: 'highlighted', scope: 'markup.highlight.djot' },
      { token: '=}', scope: 'punctuation.definition.highlight.end.djot' },
    ]
  },
  {
    name: 'Insert',
    input: '{+inserted+}',
    expects: [
      { token: '{+', scope: 'punctuation.definition.insert.begin.djot' },
      { token: 'inserted', scope: 'markup.inserted.djot' },
      { token: '+}', scope: 'punctuation.definition.insert.end.djot' },
    ]
  },
  {
    name: 'Delete',
    input: '{-deleted-}',
    expects: [
      { token: '{-', scope: 'punctuation.definition.delete.begin.djot' },
      { token: 'deleted', scope: 'markup.deleted.djot' },
      { token: '-}', scope: 'punctuation.definition.delete.end.djot' },
    ]
  },

  // ==================== SUPER/SUBSCRIPT ====================
  {
    name: 'Superscript shorthand',
    input: 'E=mc^2^',
    expects: [
      { token: '^', scope: 'punctuation.definition.superscript.begin.djot' },
      { token: '2', scope: 'markup.superscript.djot' },
    ]
  },
  {
    name: 'Subscript shorthand',
    input: 'H~2~O',
    expects: [
      { token: '~', scope: 'punctuation.definition.subscript.begin.djot' },
      { token: '2', scope: 'markup.subscript.djot' },
    ]
  },
  {
    name: 'Braced superscript',
    input: '{^super text^}',
    expects: [
      { token: '{^', scope: 'punctuation.definition.superscript.begin.djot' },
      { token: 'super text', scope: 'markup.superscript.djot' },
      { token: '^}', scope: 'punctuation.definition.superscript.end.djot' },
    ]
  },
  {
    name: 'Braced subscript',
    input: '{~sub text~}',
    expects: [
      { token: '{~', scope: 'punctuation.definition.subscript.begin.djot' },
      { token: 'sub text', scope: 'markup.subscript.djot' },
      { token: '~}', scope: 'punctuation.definition.subscript.end.djot' },
    ]
  },

  // ==================== MATH ====================
  {
    name: 'Inline math',
    input: 'Equation $`E=mc^2`$ here',
    expects: [
      { token: '$`', scope: 'punctuation.definition.math.begin.djot' },
      { token: 'E=mc^2', scope: 'markup.math.inline.djot' },
    ]
  },
  {
    name: 'Display math',
    input: '$$\nx^2\n$$',
    expects: [
      { token: '$$', scope: 'keyword.control.math.begin.djot' },
    ]
  },

  // ==================== SYMBOLS ====================
  {
    name: 'Symbol',
    input: 'I :heart: djot',
    expects: [
      { token: ':', scope: 'punctuation.definition.symbol.begin.djot' },
      { token: 'heart', scope: 'constant.character.symbol.djot' },
    ]
  },

  // ==================== SMART PUNCTUATION ====================
  {
    name: 'Em dash',
    input: 'wait---what',
    expects: [
      { token: '---', scope: 'punctuation.dash.em.djot' },
    ]
  },
  {
    name: 'En dash',
    input: '1--10',
    expects: [
      { token: '--', scope: 'punctuation.dash.en.djot' },
    ]
  },
  {
    name: 'Ellipsis',
    input: 'wait...',
    expects: [
      { token: '...', scope: 'punctuation.ellipsis.djot' },
    ]
  },

  // ==================== ESCAPES ====================
  {
    name: 'Escaped asterisk',
    input: '\\*not strong\\*',
    expects: [
      { token: '\\*', scope: 'constant.character.escape.djot' },
    ]
  },
  {
    name: 'Hard line break',
    input: 'line1\\\nline2',
    expects: [
      { token: '\\', scope: 'constant.character.escape.linebreak.djot' },
    ]
  },

  // ==================== ATTRIBUTES ====================
  {
    name: 'Block attribute with class',
    input: '{.highlight}',
    expects: [
      { token: '{', scope: 'punctuation.definition.attribute.begin.djot' },
      { token: '.', scope: 'punctuation.definition.class.djot' },
      { token: 'highlight', scope: 'entity.other.attribute.class.djot' },
    ]
  },
  {
    name: 'Block attribute with ID',
    input: '{#intro}',
    expects: [
      { token: '#', scope: 'punctuation.definition.id.djot' },
      { token: 'intro', scope: 'entity.other.attribute.id.djot' },
    ]
  },
  {
    name: 'Block attribute with key-value',
    input: '{data-value="42"}',
    expects: [
      { token: 'data-value', scope: 'entity.other.attribute.name.djot' },
      { token: '=', scope: 'punctuation.separator.key-value.djot' },
      { token: '"42"', scope: 'string.quoted.attribute.value.djot' },
    ]
  },

  // ==================== FRONTMATTER ====================
  {
    name: 'YAML frontmatter',
    input: '---\ntitle: Test\n---',
    expects: [
      { token: '---', scope: 'punctuation.definition.frontmatter.djot' },
    ]
  },

  // ==================== EDGE CASES ====================
  {
    name: 'Table not matching as line block',
    input: '| A | B | C |',
    expects: [
      { token: '|', scope: 'keyword.operator.table.pipe.djot' },
    ]
  },
  {
    name: 'Link not matching as image',
    input: '[link](url)',
    expects: [
      { token: '[', scope: 'punctuation.definition.link.begin.djot' },
      { token: 'url', scope: 'markup.underline.link.djot' },
    ]
  },
  {
    name: 'Multiple emphasis on same line',
    input: '*one* and *two*',
    expects: [
      { token: 'one', scope: 'markup.bold.djot' },
      { token: 'two', scope: 'markup.bold.djot' },
    ]
  },
];

async function runTests() {
  const grammar = await registry.loadGrammar('text.djot');
  if (!grammar) {
    console.error('Failed to load grammar');
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    const lines = test.input.split('\n');
    let ruleStack = vsctm.INITIAL;
    const allTokens = [];

    for (const line of lines) {
      const result = grammar.tokenizeLine(line, ruleStack);
      for (const token of result.tokens) {
        allTokens.push({
          text: line.substring(token.startIndex, token.endIndex),
          scopes: token.scopes,
        });
      }
      ruleStack = result.ruleStack;
    }

    let testPassed = true;
    const errors = [];

    for (const expect of test.expects) {
      const found = allTokens.find(t =>
        t.text === expect.token &&
        t.scopes.some(s => s.includes(expect.scope))
      );

      if (!found) {
        testPassed = false;
        const matching = allTokens.find(t => t.text === expect.token);
        if (matching) {
          errors.push(`  Token "${expect.token}" found but missing scope "${expect.scope}"\n    Got: ${matching.scopes.join(', ')}`);
        } else {
          errors.push(`  Token "${expect.token}" not found in output`);
        }
      }
    }

    if (testPassed) {
      console.log(`✓ ${test.name}`);
      passed++;
    } else {
      console.log(`✗ ${test.name}`);
      errors.forEach(e => console.log(e));
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
