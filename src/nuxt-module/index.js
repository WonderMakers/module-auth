const defaultOptions = require('./options')
const path = require('path')

export default function (moduleOptions = {}) {
  const options = Object.assign({}, defaultOptions, this.options.auth, moduleOptions)
  this.addPlugin({
    src: path.resolve(__dirname, 'nuxt.auth.plugin.js'),
    fileName: 'auth.plugin.js',
    options
  })
}
