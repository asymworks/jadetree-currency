const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const rewrite = require('rollup-plugin-rewrite');
const { terser } = require('rollup-plugin-terser');
const typescript = require('rollup-plugin-typescript2');

module.exports = (config) => {
  const { input, outputFile, name, globals, rewriteOpts } = config;
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
        format: 'umd',
        file: outputFile.replace(/\.min\.js$/, '.js'),
        name: name,
        plugins: rewriteOpts ? [rewrite(rewriteOpts)] : [],
        sourcemap: false,
        exports: 'named',
        globals,
      },
      {
        format: 'umd',
        file: outputFile.replace(/(?<!(min))\.js$/, '.min.js'),
        name: name,
        plugins: [
          terser(),
          ...(rewriteOpts ? [rewrite(rewriteOpts)] : []),
        ],
        sourcemap: true,
        exports: 'named',
        globals,
      },
    ],
  };
};
