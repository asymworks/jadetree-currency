const fs = require('fs');
const util = require('util');
const path = require('path');

const rollup = require('rollup');
const configFactoryESM = require('./rollup.esm');
const configFactoryUMD = require('./rollup.umd');

const packageJson = require('../package.json');

// External Locale class for locales
const localeModule = path.resolve(__dirname, '../src/locale.ts');

// Locale Root Directories
const localeRoot = path.join(path.dirname(packageJson.main), 'locales');

// List of Languages
const langs = fs.readdirSync(path.join(__dirname, '../src/locales'))
  .map((f) => f.split('.')[0])
  .filter((l) => l !== 'index');

// Build Function
async function build(options) {
  const startTime = new Date();
  const outputs = Array.isArray(options.output)
    ? options.output
    : [options.output];

  process.stdout.write(
    `\n\x1b[34m${options.input.input} \u2192 ${outputs.map((o) => o.file || o.dir).join(', ')}\x1b[0m\n`
  );

  const bundle = await rollup.rollup(options.input);
  outputs.forEach(async (output) => await bundle.write(output));

  const elapsed = ((new Date() - startTime) / 1000).toFixed(1);
  outputs.forEach((o) => {
    process.stdout.write(`\x1b[32mbuilt ${o.file || o.dir} in ${elapsed} seconds\x1b[0m\n`);
  });
}

// Build All Outputs
(async () => {
  const startTime = new Date();
  try {
    // Build Library (ES5)
    await build(configFactoryESM({
      input: './src/index.ts',
      outputDir: path.dirname(packageJson.module),
      external: [...Object.keys(packageJson.dependencies)],
      declarations: true,
    }));

    // Build Locale Files (ES5)
    await build(configFactoryESM({
      input: './src/locales/index.ts',
      outputDir: path.dirname(packageJson.module),
      external: [...Object.keys(packageJson.dependencies)],
      declarations: false,
    }));

    // Build Library (UMD Bundle)
    await build(configFactoryUMD({
      input: './src/index.ts',
      outputFile: packageJson.main,
      name: 'jadetree_currency',
      globals: {},
    }));

    // Build Locale Index File (UMD Bundle)
    await build(configFactoryUMD({
      input: './src/locales/index.ts',
      outputFile: path.join(localeRoot, 'index.js'),
      name: 'jadetree_currency_l10n',
      globals: {
        [localeModule]: 'jadetree_currency',
      },
      rewriteOpts: {
        find: /locale\.ts/mg,
        replace: () => 'index.js',
      },
    }));

    // Build Locale Data Files (UMD Bundle)
    for (l of langs) {
      await build(configFactoryUMD({
        input: `./src/locales/${l}.ts`,
        outputFile: path.join(localeRoot, `${l}.js`),
        name: `jadetree_currency_l10n_${l}`,
        globals: {
          [localeModule]: 'jadetree_currency',
        },
        rewriteOpts: {
          find: /locale\.ts/mg,
          replace: () => 'index.js',
        },
      }));
    }
  }
  catch (e) {
    console.log(e);  // eslint-disable-line no-console
  }

  const elapsed = ((new Date() - startTime) / 1000).toFixed(1);
  process.stdout.write(`\n\x1b[32mBuilt all files in ${elapsed} seconds\x1b[0m\n`);
})();
