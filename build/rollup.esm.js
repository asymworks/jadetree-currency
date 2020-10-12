const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('rollup-plugin-terser');
const typescript = require('rollup-plugin-typescript2');

module.exports = (config) => {
  const { input, outputDir, outputRoot, external, rewriteOpts, declarations } = config;
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
              declaration: declarations,
              target: 'es6',
            },
          },
        }),
      ],
    },
    output: {
      format: 'esm',
      dir: outputDir,
      preserveModules: true,
      sourcemap: false,
    },
  };
};
