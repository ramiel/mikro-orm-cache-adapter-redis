/* eslint-env node */
// import { nodeResolve } from '@rollup/plugin-node-resolve';
// import commonjs from 'rollup-plugin-commonjs';
// import resolve from 'rollup-plugin-node-resolve';
import pkg from './package.json';
import typescript from 'typescript';
import typescriptPlugin from 'rollup-plugin-typescript2';

const isProd = process.env.NODE_ENV === 'production';

const externalDepsRegexp = Object.keys(pkg.peerDependencies || {}).map(
  (dep) => new RegExp(`${dep}(/.+)?`),
);

export default [
  {
    input: 'src/index.ts',
    external: (id) => {
      // We consider external any dep in peerDependecies or a sub import
      // e.g.  reakit, reakit/Portal
      return externalDepsRegexp.reduce((acc, regexp) => {
        return acc || regexp.test(id);
      }, false);
    },
    plugins: [
      typescriptPlugin({
        clean: isProd,
        typescript,
      }),
    ],
    output: [
      { file: pkg.module, format: 'es' },
      { file: pkg.main, format: 'cjs' },
    ],
  },
];
