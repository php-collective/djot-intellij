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
    'This is _emphasized_ and *strong* text.',
    '_emphasis_',
    '*strong*',
    'text _emphasis_ more',
    'text *strong* more',
  ];

  for (const input of tests) {
    console.log('\nInput: "' + input + '"');
    const result = g.tokenizeLine(input, vsctm.INITIAL);
    for (const token of result.tokens) {
      const text = input.substring(token.startIndex, token.endIndex);
      const scopes = token.scopes.filter(s => s !== 'text.djot');
      if (scopes.length > 0) {
        console.log('  "' + text + '" => ' + scopes.join(' > '));
      }
    }
  }
}

test().catch(console.error);
