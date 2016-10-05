'use strict'

const {
  env: {
    GIST_TOKEN,
    GIST_ID,
    PROJECT_VERSION
  },
  exit,
  stdout,
  stderr
} = require('process')

if (!RELEASE_GIST) {
  stdout.write('Skipped Gist release\n')
  exit(1)
}

if (!GIST_ID || !GIST_TOKEN) {
  stderr.write('Missing environment variables\n')
  exit(1)
}
