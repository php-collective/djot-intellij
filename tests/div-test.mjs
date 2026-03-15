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

  const tests = [
    '::: warning\ncontent here\n:::',
    ':::: outer\n::: inner\ncontent\n:::\n::::',
    '::: note\nsome text\n:::',
    ':::warning\ncontent\n:::'
  ];

  for (const input of tests) {
    console.log('\n========================================');
    console.log('Input:');
    console.log(input);
    console.log('\nTokens:');

    const lines = input.split('\n');
    let ruleStack = vsctm.INITIAL;

    for (const line of lines) {
      console.log('Line: "' + line + '"');
      const result = g.tokenizeLine(line, ruleStack);
      for (const token of result.tokens) {
        const text = line.substring(token.startIndex, token.endIndex);
        const scopes = token.scopes.filter(s => s !== 'text.djot');
        console.log('  "' + text + '" => ' + (scopes.length ? scopes.join(' > ') : '(no scope)'));
      }
      ruleStack = result.ruleStack;
    }
  }
}

test().catch(console.error);
