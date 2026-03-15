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

  // Test thematic breaks after content (not at document start)
  const tests = [
    { name: 'Asterisks after paragraph', input: 'Some text\n\n***' },
    { name: 'Dashes after paragraph', input: 'Some text\n\n---' },
    { name: 'Underscores after paragraph', input: 'Some text\n\n___' },
    { name: 'Dashes at document start (frontmatter)', input: '---\ntitle: Test\n---' },
    { name: 'Spaced asterisks', input: 'Some text\n\n* * *' },
  ];

  for (const test of tests) {
    console.log('\n=== ' + test.name + ' ===');
    console.log('Input:', JSON.stringify(test.input));

    const lines = test.input.split('\n');
    let ruleStack = vsctm.INITIAL;

    for (const line of lines) {
      if (line.trim()) {
        console.log('Line: "' + line + '"');
        const result = g.tokenizeLine(line, ruleStack);
        for (const token of result.tokens) {
          const text = line.substring(token.startIndex, token.endIndex);
          const scopes = token.scopes.filter(s => s !== 'text.djot');
          if (scopes.length > 0) {
            console.log('  "' + text + '" => ' + scopes.join(' > '));
          }
        }
        ruleStack = result.ruleStack;
      } else {
        // Process blank lines to update rule stack
        const result = g.tokenizeLine(line, ruleStack);
        ruleStack = result.ruleStack;
      }
    }
  }
}

test().catch(console.error);
