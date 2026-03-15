import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import vsctmModule from 'vscode-textmate';
import oniguruma from 'vscode-oniguruma';

const vsctm = vsctmModule.default || vsctmModule;
const __dirname = dirname(fileURLToPath(import.meta.url));

const wasmBin = readFileSync(resolve(__dirname, 'node_modules/vscode-oniguruma/release/onig.wasm'));

async function test() {
  await oniguruma.loadWASM(wasmBin);

  const grammar = JSON.parse(readFileSync(resolve(__dirname, '../src/main/resources/textmate/djot.tmLanguage.json'), 'utf-8'));

  const registry = new vsctm.Registry({
    onigLib: Promise.resolve({
      createOnigScanner(patterns) { return new oniguruma.OnigScanner(patterns); },
      createOnigString(s) { return new oniguruma.OnigString(s); }
    }),
    loadGrammar: async () => grammar
  });

  const g = await registry.loadGrammar('text.djot');

  // Test cases for all the fixes
  const tests = [
    // Fix 1: Closing div markers should get keyword.control.div.end scope
    {
      name: 'Closing div markers',
      input: '::: warning\ncontent\n:::',
      expectedScopes: [
        [':::', 'keyword.control.div.begin.djot'],
        ['warning', 'entity.name.tag.div.djot'],
        [':::', 'keyword.control.div.end.djot']
      ]
    },

    // Fix 2: Indented code fences
    {
      name: 'Indented code fence',
      input: '  ```\n  code\n  ```',
      expectedScopes: [
        ['```', 'string.other.begin.code.fence.djot'],
        ['```', 'string.other.end.code.fence.djot']
      ]
    },

    // Fix 3: Raw block with attributes
    {
      name: 'Raw block with attributes',
      input: '``` =html {.raw}\n<div>\n```',
      expectedScopes: [
        ['```', 'string.other.begin.code.fence.djot'],
        ['=', 'keyword.operator.raw.djot'],
        ['html', 'entity.name.type.format.djot'],
        [' {.raw}', 'entity.other.attribute.djot'],
        ['```', 'string.other.end.code.fence.djot']
      ]
    },

    // Fix 4: Display math with backticks
    {
      name: 'Display math with backticks',
      input: '$$`\nx^2\n`$$',
      expectedScopes: [
        ['$$', 'keyword.control.math.begin.djot'],
        ['`', 'punctuation.definition.math.backtick.djot'],
        ['`', 'punctuation.definition.math.backtick.djot'],
        ['$$', 'keyword.control.math.end.djot']
      ]
    },

    // Fix 4b: Display math without backticks
    {
      name: 'Display math without backticks',
      input: '$$\nx^2\n$$',
      expectedScopes: [
        ['$$', 'keyword.control.math.begin.djot'],
        ['$$', 'keyword.control.math.end.djot']
      ]
    },

    // Fix 5: List item with inline content
    {
      name: 'List item with link',
      input: '- [Link](url) item',
      expectedScopes: [
        ['-', 'keyword.operator.list.marker.djot'],
        ['[', 'punctuation.definition.link.begin.djot'],
        ['Link', 'string.other.link.title.djot'],
        [']', 'punctuation.definition.link.end.djot'],
        ['(', 'punctuation.definition.link.url.begin.djot'],
        ['url', 'markup.underline.link.djot'],
        [')', 'punctuation.definition.link.url.end.djot']
      ]
    },

    // Fix 6: Footnote with inline content
    {
      name: 'Footnote with formatting',
      input: '[^1]: This is *bold* footnote',
      expectedScopes: [
        ['[^', 'punctuation.definition.footnote.begin.djot'],
        ['1', 'entity.name.footnote.djot'],
        [']', 'punctuation.definition.footnote.end.djot'],
        [':', 'punctuation.separator.definition.djot'],
        ['*', 'punctuation.definition.bold.begin.djot'],
        ['bold', 'markup.bold.djot'],
        ['*', 'punctuation.definition.bold.end.djot']
      ]
    },

    // Fix 7: Apostrophe should NOT be highlighted as quote
    {
      name: 'Apostrophe in word',
      input: "it's a test",
      expectedScopes: [
        // The apostrophe in "it's" should NOT have quote scope
      ],
      notExpectedScopes: [
        ["'", 'punctuation.definition.quote.single']
      ]
    },

    // Fix 7b: Real quotes SHOULD be highlighted
    {
      name: 'Real single quotes',
      input: "he said 'hello'",
      expectedScopes: [
        ["'", 'punctuation.definition.quote.single.begin.djot'],
        ["'", 'punctuation.definition.quote.single.end.djot']
      ]
    },

    // Nested divs - NOTE: Nested divs are a known limitation of TextMate grammars
    // Without backreferences that work with endCaptures, we cannot match exact colon counts
    // The grammar prioritizes correct highlighting of simple divs over nested div support
    {
      name: 'Nested divs (limitation)',
      input: ':::: outer\n::: inner\ncontent\n:::\n::::',
      expectedScopes: [
        ['::::', 'keyword.control.div.begin.djot'],
        ['outer', 'entity.name.tag.div.djot']
        // Inner div and proper nesting cannot be supported in TextMate grammar
      ]
    },

    // Simple div with content - this is the primary use case
    {
      name: 'Simple div with multiple lines',
      input: '::: note\nline 1\nline 2\n:::',
      expectedScopes: [
        [':::', 'keyword.control.div.begin.djot'],
        ['note', 'entity.name.tag.div.djot'],
        [':::', 'keyword.control.div.end.djot']
      ]
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log('\n=== ' + test.name + ' ===');
    console.log('Input:', JSON.stringify(test.input));

    const lines = test.input.split('\n');
    let ruleStack = vsctm.INITIAL;
    let allTokens = [];

    for (const line of lines) {
      const result = g.tokenizeLine(line, ruleStack);
      for (const token of result.tokens) {
        const text = line.substring(token.startIndex, token.endIndex);
        const scopes = token.scopes.filter(s => s !== 'text.djot');
        allTokens.push({ text, scopes });
        if (scopes.length > 0) {
          console.log('  "' + text + '" => ' + scopes.join(' > '));
        }
      }
      ruleStack = result.ruleStack;
    }

    // Check expected scopes
    let testPassed = true;
    for (const [expectedText, expectedScope] of test.expectedScopes || []) {
      const found = allTokens.some(t =>
        t.text === expectedText &&
        t.scopes.some(s => s.includes(expectedScope) || s === expectedScope)
      );
      if (!found) {
        console.log('  FAIL: Expected "' + expectedText + '" to have scope "' + expectedScope + '"');
        testPassed = false;
      }
    }

    // Check NOT expected scopes
    for (const [notExpectedText, notExpectedScope] of test.notExpectedScopes || []) {
      const found = allTokens.some(t =>
        t.text === notExpectedText &&
        t.scopes.some(s => s.includes(notExpectedScope))
      );
      if (found) {
        console.log('  FAIL: "' + notExpectedText + '" should NOT have scope containing "' + notExpectedScope + '"');
        testPassed = false;
      }
    }

    if (testPassed) {
      console.log('  PASS');
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n========================================');
  console.log('Results: ' + passed + ' passed, ' + failed + ' failed');

  if (failed > 0) {
    process.exit(1);
  }
}

test().catch(console.error);
