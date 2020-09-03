import buble from '@rollup/plugin-buble'
import builtins from 'builtin-modules'

const pkg = require('./package.json')

export default {
  input: 'src/index.js',
  output: [
    { format: 'cjs', file: pkg.main, sourcemap: true, interop: false, exports: 'default' },
    { format: 'es', file: pkg.module, sourcemap: true }
  ],
  external: builtins.concat(Object.keys(pkg.dependencies)),
  plugins: [
    buble({
      include: 'src/**',
      target: { node: 8 }
    })
  ]
}
