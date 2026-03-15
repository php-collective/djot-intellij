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

  // More edge cases focusing on potential issues
  const tests = [
    // djot-php specific features
    { name: 'Abbreviation multiline', input: '*[HTML]: Hypertext\n    Markup Language' },
    { name: 'Caption after table', input: '| A | B |\n|---|---|\n| 1 | 2 |\n^ Table caption' },
    { name: 'Caption after image', input: '![alt](img.png)\n^ Image caption' },

    // Block element edge cases
    { name: 'Four space indent', input: '    indented code?' },
    { name: 'Code fence in list', input: '- item\n  ```\n  code\n  ```' },
    { name: 'Blockquote multiline', input: '> line 1\n> line 2' },
    { name: 'Blockquote lazy continuation', input: '> line 1\nline 2' },

    // Inline edge cases
    { name: 'Underscore in URL', input: '[link](https://example.com/some_path)' },
    { name: 'Asterisk in URL', input: '[link](https://example.com/*path*)' },
    { name: 'Backtick in link text', input: '[`code`](url)' },
    { name: 'Empty image alt', input: '![](image.png)' },
    { name: 'Reference with spaces', input: '[link text][ref name]' },

    // Attribute edge cases
    { name: 'Attribute with single quotes', input: "{key='value'}" },
    { name: 'Boolean attribute', input: '{reversed}' },
    { name: 'Attribute no value', input: '{disabled}' },

    // Math edge cases
    { name: 'Display math with backtick', input: '$$`\nx^2\n`$$' },
    { name: 'Inline math complex', input: '$`\\frac{a}{b}`$' },

    // Table edge cases
    { name: 'Table header marker', input: '|= Header |' },
    { name: 'Table alignment left', input: '|:--- |' },
    { name: 'Table alignment center', input: '|:---:|' },
    { name: 'Table alignment right', input: '| ---:|' },

    // Smart quotes
    { name: 'Smart double quotes', input: '"quoted text"' },
    { name: 'Smart single quotes', input: "'quoted'" },
    { name: 'Apostrophe', input: "it's" },

    // Definition list term highlighting
    { name: 'Definition list full', input: 'Term\n: Definition' },

    // Line block edge cases
    { name: 'Line block multiple', input: '| Line 1\n| Line 2\n| Line 3' },

    // Nested structures
    { name: 'Emphasis in link', input: '[_emphasis_](url)' },
    { name: 'Strong in link', input: '[*strong*](url)' },
    { name: 'Code in heading', input: '# Heading `code`' },
    { name: 'Link in heading', input: '# [Link](url) heading' },
  ];

  for (const test of tests) {
    console.log('\n=== ' + test.name + ' ===');
    console.log('Input:', JSON.stringify(test.input));

    const lines = test.input.split('\n');
    let ruleStack = vsctm.INITIAL;

    for (const line of lines) {
      const result = g.tokenizeLine(line, ruleStack);
      for (const token of result.tokens) {
        const text = line.substring(token.startIndex, token.endIndex);
        const scopes = token.scopes.filter(s => s !== 'text.djot');
        if (scopes.length > 0) {
          console.log('  "' + text + '" => ' + scopes.join(' > '));
        }
      }
      ruleStack = result.ruleStack;
    }
  }
}

test().catch(console.error);
