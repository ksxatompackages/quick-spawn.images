'use strict'

const {join, dirname, parse: parsePath} = require('path')
const {writeFileSync, readdirSync, readFileSync} = require('fs')
const {BUILD_MODE} = require('process').env
const pug = require('pug')
const PROJECT = dirname(__dirname)
const OUTPUT = join(PROJECT, 'out')
const RESOURCE = join(PROJECT, 'src')
const SCRIPTS = join(RESOURCE, 'variants')
const PUGSOURCE = readFileSync(join(RESOURCE, 'model.pug'))
const ENCODING = {encoding: 'utf8'}

const scripts = readdirSync(SCRIPTS)
  .map(
    item =>
      [join(SCRIPTS, item), parsePath(item)]
  )
  .map(
    ([script, {name}]) =>
      [require(script), name]
  )
  .map(
    ([local, name]) =>
      [{local, global, name, require, __dirname, __filename}, name]
  )

BUILD_MODE === 'Debug' || write(false, 'min')
write('\x20\x20', 'pretty')

console.log(`Build succeed!\nArtifacts are located at ${OUTPUT}`)

function write (pretty, entry) {
  const OPTIONS = {
    doctype: 'xml',
    pretty
  }
  return scripts
    .map(
      ([local, name]) =>
        [local, join(OUTPUT, `${name}.${entry}.svg`), pug.compile(PUGSOURCE, OPTIONS)]
    )
    .map(
      ([local, file, create]) =>
        writeFileSync(file, create(local) + '\n', ENCODING)
    )
}
