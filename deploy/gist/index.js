'use strict'

const NOW = new Date()

const {join, parse} = require('path')

const {readFileSync, readdirSync} = require('fs')

const GitHubAPIs = require('github')

const {
  env: {
    RELEASE_GIST,
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

const github = new GitHubAPIs()
const files = {}
const ENCODING = {encoding: 'utf8'}
const CONTAINER = join(__dirname, '..', '..', 'out')
const LIST = readdirSync(CONTAINER)

const filename = item => {
  const {name, ext} = parse(item)
  return name + '-' + PROJECT_VERSION + ext
}

for (const item of LIST) {
  const content = readFileSync(join(CONTAINER, item), ENCODING)
  files[filename(item)] = {content}
}

github.authenticate({
  type: 'token',
  token: GIST_TOKEN
})

new Promise(
  (resolve, reject) => {
    github.gists.edit({
      id: GIST_ID,
      files
    })
      .then(
        response => {
          const rfiles = response.files
          let summary = `# Release ${PROJECT_VERSION} - ${NOW.toISOString()}\n\n`
          for (const item of LIST) {
            const {raw_url: url, type, language} = rfiles[filename(item)]
            summary += ` * [${item}](${url})\n  - Type: ${type}\n  - Language: ${language}\n\n`
          }
          github.gists.edit({
            id: GIST_ID,
            files: {
              [ filename('summary.md') ]: {
                content: summary
              }
            }
          })
            .then(resolve)
            .catch(reject)
        }
      )
      .catch(reject)
  }
)
  .then(
    () => stdout.write('Gist Upload succeed')
  )
  .catch(
    () => {
      stderr.write('Upload to Gist failed.\n')
      exit(2)
    }
  )
