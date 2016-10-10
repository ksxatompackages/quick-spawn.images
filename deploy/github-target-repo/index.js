'use strict'

const {join} = require('path')

const {
  env: {
    GITHUB_RELEASE_OAUTH,
    GIT_REPO_TAG,
    TARGET_GITHUB_RELEASE_OAUTH = GITHUB_RELEASE_OAUTH,
    TARGET_GITHUB_REPO_OWNER,
    TARGET_GITHUB_REPO_NAME,
    TARGET_GITHUB_REPO_BRANCH,
    TARGET_GITHUB_REPO_DIRECTORY,
    ARTIFACTS_DIRECTORY
  }
} = require('process')

const {readdirSync, readFile} = require('fs')

const co = require('co')

const GitHubAPIs = require('github')

const {info, error} = global.console

const ENCODING = {encoding: 'utf8'}

const handle = (
  TARGET_GITHUB_RELEASE_OAUTH && TARGET_GITHUB_REPO_OWNER && TARGET_GITHUB_REPO_NAME && TARGET_GITHUB_REPO_DIRECTORY && ARTIFACTS_DIRECTORY
)
  ? (resolve, reject) => {
    co(main)
      .then(
        response => {
          info('GitHub Committing deployment finished successfully')
          info('response', response)
          resolve(response)
        }
      )
      .catch(
        response => {
          error('Failed to Deploy GitHub Committing')
          info('response', response)
          reject(response)
        }
      )
  }
  : resolve => {
    error('Missing environment variables')
    info('Skip GitHub Committing deployment')
    resolve()
  }

const promise = new Promise(handle)

module.exports = promise

function * main () {
  const github = new GitHubAPIs()
  github.authenticate({
    type: 'token',
    token: TARGET_GITHUB_RELEASE_OAUTH
  })
  const list = readdirSync(ARTIFACTS_DIRECTORY)
    .map(
      item => function * () {
        const load = (resolve, reject) => {
          const callback = (error, data) =>
            error ? reject(error) : resolve(data)
          readFile(join(ARTIFACTS_DIRECTORY, item), ENCODING, callback)
        }
        const data = yield new Promise(load)
        const content = data.toString('base64')
        const message = (
          `Update /${TARGET_GITHUB_REPO_DIRECTORY} to ${GIT_REPO_TAG}\n * Branch: ${TARGET_GITHUB_REPO_DIRECTORY}\n * Done automatically`
        )
        yield github.repos.createFile({
          user: TARGET_GITHUB_REPO_OWNER,
          repo: TARGET_GITHUB_REPO_NAME,
          branch: TARGET_GITHUB_REPO_BRANCH,
          path: join(TARGET_GITHUB_REPO_DIRECTORY, item),
          content,
          message,
          __proto__: null
        })
      }
    )
    .map(co)
  yield Promise.all(list)
}
