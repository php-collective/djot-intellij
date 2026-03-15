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
  // Headings
  {
    name: 'Heading',
    input: '# Heading 1',
    expects: [
      { token: '#', scope: 'markup.heading.marker.djot' },
    ]
  },

  // Strong and emphasis
  {
    name: 'Strong',
    input: 'This is *strong* text',
    expects: [
      { token: '*', scope: 'punctuation.definition.bold' },
      { token: 'strong', scope: 'markup.bold.djot' },
    ]
  },
  {
    name: 'Emphasis',
    input: 'This is _emphasized_ text',
    expects: [
      { token: '_', scope: 'punctuation.definition.italic' },
      { token: 'emphasized', scope: 'markup.italic.djot' },
    ]
  },

  // Code blocks
  {
    name: 'Fenced code block',
    input: '```php\ncode\n```',
    expects: [
      { token: '```', scope: 'string.other.begin.code.fence.djot' },
      { token: 'php', scope: 'entity.name.function.language.djot' },
    ]
  },
  {
    name: 'Raw code block',
    input: '``` =html\n<div>\n```',
    expects: [
      { token: '```', scope: 'string.other.begin.code.fence.djot' },
      { token: '=', scope: 'keyword.operator.raw.djot' },
      { token: 'html', scope: 'entity.name.type.format.djot' },
    ]
  },

  // Comments
  {
    name: 'Inline comment',
    input: 'Text {% comment %} more',
    expects: [
      { token: '{%', scope: 'punctuation.definition.comment.begin.djot' },
      { token: '%}', scope: 'punctuation.definition.comment.end.djot' },
    ]
  },
  {
    name: 'Fenced comment',
    input: '%%%\ncomment\n%%%',
    expects: [
      { token: '%%%', scope: 'punctuation.definition.comment.begin.djot' },
    ]
  },

  // Task lists
  {
    name: 'Task list - checked',
    input: '- [x] Done',
    expects: [
      { token: '-', scope: 'keyword.operator.list.marker.djot' },
      { token: '[x]', scope: 'markup.inserted.checkbox.checked.djot' },
    ]
  },
  {
    name: 'Task list - unchecked',
    input: '- [ ] Todo',
    expects: [
      { token: '-', scope: 'keyword.operator.list.marker.djot' },
      { token: '[ ]', scope: 'markup.deleted.checkbox.unchecked.djot' },
    ]
  },

  // Blockquote
  {
    name: 'Blockquote',
    input: '> Quote text',
    expects: [
      { token: '>', scope: 'keyword.operator.blockquote.djot' },
    ]
  },

  // Div
  {
    name: 'Div',
    input: '::: warning\ncontent\n:::',
    expects: [
      { token: ':::', scope: 'keyword.control.div.begin.djot' },
      { token: 'warning', scope: 'entity.name.tag.div.djot' },
    ]
  },

  // Tables
  {
    name: 'Table',
    input: '| A | B |',
    expects: [
      { token: '|', scope: 'keyword.operator.table.pipe.djot' },
    ]
  },

  // Definition list
  {
    name: 'Definition list',
    input: ': Definition here',
    expects: [
      { token: ':', scope: 'keyword.operator.definition.djot' },
    ]
  },

  // Caption
  {
    name: 'Caption',
    input: '^ Caption text',
    expects: [
      { token: '^', scope: 'punctuation.definition.caption.djot' },
    ]
  },

  // Links
  {
    name: 'Inline link',
    input: '[text](https://example.com)',
    expects: [
      { token: '[', scope: 'punctuation.definition.link.begin.djot' },
      { token: 'https://example.com', scope: 'markup.underline.link.djot' },
    ]
  },

  // Abbreviation
  {
    name: 'Abbreviation definition',
    input: '*[HTML]: Hyper Text Markup Language',
    expects: [
      { token: '*[', scope: 'punctuation.definition.abbreviation.begin.djot' },
      { token: 'HTML', scope: 'entity.name.abbreviation.djot' },
    ]
  },

  // Thematic break
  {
    name: 'Thematic break',
    input: '***',
    expects: [
      { token: '***', scope: 'keyword.control.thematic-break.djot' },
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
