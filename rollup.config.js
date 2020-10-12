import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

import packageJson from './package.json';

export default {
  input: 'lib/index.js',
  output: [
    {
      format: 'cjs',
      file: packageJson.main,
      sourcemap: true,
    },
    {
      format: 'iife',
      file: packageJson.browser,
      name: 'JtCurrency',
    },
  ],
  plugins: [
    peerDepsExternal(),
    resolve(),
    commonjs(),
    terser(),
  ],
};
