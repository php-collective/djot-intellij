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

  // Minimal grammar to test endCaptures
  const grammar = {
    "scopeName": "test.div",
    "patterns": [
      { "include": "#div" }
    ],
    "repository": {
      "div": {
        "begin": "^(:{3,})\\s*(\\w+)?\\s*$",
        "end": "^(:{3,})\\s*$",
        "beginCaptures": {
          "1": { "name": "begin.marker" },
          "2": { "name": "begin.name" }
        },
        "endCaptures": {
          "1": { "name": "end.marker" }
        },
        "contentName": "div.content",
        "patterns": [
          { "include": "#div" }
        ]
      }
    }
  };

  const registry = new vsctm.Registry({
    onigLib: Promise.resolve({
      createOnigScanner(patterns) { return new oniguruma.OnigScanner(patterns); },
      createOnigString(s) { return new oniguruma.OnigString(s); }
    }),
    loadGrammar: async () => grammar
  });

  const g = await registry.loadGrammar('test.div');

  const input = '::: warning\ncontent\n:::';
  console.log('Input:', JSON.stringify(input));

  const lines = input.split('\n');
  let ruleStack = vsctm.INITIAL;

  for (const line of lines) {
    console.log('Line: "' + line + '"');
    const result = g.tokenizeLine(line, ruleStack);
    for (const token of result.tokens) {
      const text = line.substring(token.startIndex, token.endIndex);
      console.log('  "' + text + '" => ' + token.scopes.join(' > '));
    }
    ruleStack = result.ruleStack;
  }
}

test().catch(console.error);
