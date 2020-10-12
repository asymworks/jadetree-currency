const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const rewrite = require('rollup-plugin-rewrite');
const terser = require('rollup-plugin-terser');
const typescript = require('rollup-plugin-typescript2');

module.exports = (config) => {
  const { input, outputFile, external, rewriteOpts } = config;
  return {
    input: {
      input,
      external,
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
    output: {
      format: 'cjs',
      file: outputFile,
      plugins: rewriteOpts ? [rewrite(rewriteOpts)] : [],
      sourcemap: false,
      exports: 'named',
    },
  };
};
