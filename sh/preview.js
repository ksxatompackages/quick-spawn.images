'use strict'
const {join} = require('path')
const {readdirSync, readFileSync, writeFileSync} = require('fs')
const ENCODING = {encoding: 'utf8'}
const create = require('pug')
  .compile(readFileSync(join(__dirname, 'lib', 'preview.pug'), ENCODING), {pretty: '\x20\x20'})
const source = join(__dirname, '..', 'out')
const list = readdirSync(source)
  .map(name => ({name, file: join(source, name)}))
const style = {
  'font-family': require('../dev-lib/font-family.js')
}
writeFileSync(
  join(__dirname, '..', '.preview.html'),
  create({list, html: {style}}),
  ENCODING
)
console.log('Created preview file')
