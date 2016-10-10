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

const ENCODING = {encoding: 'base64'}

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
      item =>
        (resolve, reject) => {
          const callback = (error, content) =>
            error ? reject(error) : resolve({content, item})
          readFile(join(ARTIFACTS_DIRECTORY, item), ENCODING, callback)
        }
    )
    .map(
      fn =>
        new Promise(fn)
    )
  const user = TARGET_GITHUB_REPO_OWNER
  const repo = TARGET_GITHUB_REPO_NAME
  const branch = TARGET_GITHUB_REPO_BRANCH
  for (const promise of list) {
    const {content, item} = yield promise
    const path = join(TARGET_GITHUB_REPO_DIRECTORY, item)
    const message = `Update /${path} to ${GIT_REPO_TAG}\n * Branch: ${branch}\n * Done automatically`
    yield github.repos.createFile({user, repo, branch, path, content, message})
  }
}
