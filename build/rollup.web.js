const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const { terser } = require('rollup-plugin-terser');
const typescript = require('rollup-plugin-typescript2');

module.exports = (config) => {
  const { input, outputFile, name, globals } = config;
  return {
    input: {
      input,
      external: [...Object.keys(globals)],
      plugins: [
        nodeResolve(),
        commonjs(),
        typescript({
          tsconfigOverride: {
            compilerOptions: {
              declaration: false,
              target: 'es5',
            },
          },
        }),
      ],
    },
    output: [
      {
        format: 'iife',
        file: outputFile.replace(/\.min\./, '.bundle.'),
        name: 'jadetree_currency',
        sourcemap: false,
        exports: 'named',
        globals,
      },
      {
        format: 'iife',
        file: outputFile,
        name: name,
        plugins: [ terser() ],
        sourcemap: true,
        exports: 'named',
        globals,
      },
    ],
  };
};
