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

  // Edge cases to analyze
  const tests = [
    { name: 'Strong at end of line', input: 'text *strong*' },
    { name: 'Emphasis at end of line', input: 'text _emphasis_' },
    { name: 'Strong with punctuation after', input: '*strong*, more' },
    { name: 'Emphasis with punctuation after', input: '_emphasis_. more' },
    { name: 'Code fence with 4 backticks', input: '````\ncode with ``` inside\n````' },
    { name: 'Nested divs', input: ':::: outer\n::: inner\ncontent\n:::\n::::' },
    { name: 'Table row with attributes', input: '| A | B |{.class}' },
    { name: 'Link with title', input: '[text](url "title")' },
    { name: 'Image with trailing attributes', input: '![alt](img.png){.photo}' },
    { name: 'Span inside emphasis', input: '_[text]{.class}_' },
    { name: 'Multiple block attributes', input: '{.class #id key=value}' },
    { name: 'Indented code fence', input: '  ```\n  code\n  ```' },
    { name: 'Raw block =html with attributes', input: '``` =html {.raw}\n<div>\n```' },
    { name: 'Blockquote with emphasis', input: '> This is *important*' },
    { name: 'List item with link', input: '- [Link](url) item' },
    { name: 'Definition with colon in content', input: ': Definition: with colon' },
    { name: 'Footnote with formatting', input: '[^1]: This is *bold* footnote' },
    { name: 'Multi-word superscript', input: 'text^multi word^more' },
    { name: 'Verbatim with format', input: '`code`{=html} text' },
    { name: 'Symbol with numbers', input: ':emoji123:' },
    { name: 'Autolink http', input: '<http://example.com>' },
    { name: 'Empty span with attributes', input: '[]{.empty}' },
    { name: 'Pipe in table cell', input: '| A \\| B | C |' },
    { name: 'Escaped underscore', input: '\\_not emphasis\\_' },
    { name: 'Consecutive emphasis', input: '*a* *b* *c*' },
    { name: 'Strong then emphasis', input: '*strong* and _emphasis_' },
    { name: 'Highlight in paragraph', input: 'Some {=highlighted=} text' },
    { name: 'Insert and delete', input: '{+added+} and {-removed-}' },
    { name: 'Nested braces in code', input: '`{nested}` code' },
    { name: 'URL with special chars', input: '[link](https://example.com/path?a=1&b=2)' },
  ];

  let issues = [];

  for (const test of tests) {
    console.log('\n=== ' + test.name + ' ===');
    console.log('Input:', JSON.stringify(test.input));

    const lines = test.input.split('\n');
    let ruleStack = vsctm.INITIAL;
    let hasHighlight = false;

    for (const line of lines) {
      const result = g.tokenizeLine(line, ruleStack);
      for (const token of result.tokens) {
        const text = line.substring(token.startIndex, token.endIndex);
        const scopes = token.scopes.filter(s => s !== 'text.djot');
        if (scopes.length > 0) {
          hasHighlight = true;
          console.log('  "' + text + '" => ' + scopes.join(' > '));
        }
      }
      ruleStack = result.ruleStack;
    }

    if (!hasHighlight) {
      issues.push(test.name + ': No highlighting detected');
    }
  }

  if (issues.length > 0) {
    console.log('\n=== POTENTIAL ISSUES ===');
    issues.forEach(i => console.log('- ' + i));
  }
}

test().catch(console.error);
