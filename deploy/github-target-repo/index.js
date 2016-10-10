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

const encoding = 'utf8'
const ENCODING = {encoding}
const FILEBLOB = 100644

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
  const user = TARGET_GITHUB_REPO_OWNER
  const repo = TARGET_GITHUB_REPO_NAME
  const branch = TARGET_GITHUB_REPO_BRANCH
  const ref = `heads/${branch}`
  const {object: {sha: baseSHA}} = yield github.gitdata.getReference({user, repo, ref})
  const parents = [baseSHA]
  const {sha: baseTreeSHA} = yield github.gitdata.getTree({user, repo, sha: baseSHA})
  const list = readdirSync(ARTIFACTS_DIRECTORY)
    .map(
      item => [
        item,
        new Promise(
          (resolve, reject) => {
            const callback = (error, content) =>
              error ? reject(error) : resolve(content)
            readFile(join(ARTIFACTS_DIRECTORY, item), ENCODING, callback)
          }
        )
      ]
    )
    .map(
      ([item, promise]) => [
        item,
        new Promise(
          (resolve, reject) => {
            const onfulfill = content =>
              github.gitdata.createBlob({user, repo, content, encoding})
                .then(resolve, reject)
            promise.then(onfulfill, reject)
          }
        )
      ]
    )
    .map(
      ([item, promise]) => new Promise(
        (resolve, reject) => promise.then(({sha}) => resolve({item, sha}), reject)
      )
    )
  const listreponse = yield Promise.all(list)
  const {sha: tree} = yield github.gitdata.createTree({
    tree: listreponse.map(
      ({item, sha}) => ({
        path: join(TARGET_GITHUB_REPO_DIRECTORY, item),
        mode: FILEBLOB,
        type: 'blob',
        base_tree: baseTreeSHA,
        sha,
        __proto__: null
      })
    ),
    user,
    repo,
    __proto__: null
  })
  const message = (
    `Update /${TARGET_GITHUB_REPO_DIRECTORY} to ${GIT_REPO_TAG}\n * Branch: ${repo}\n * Done automatically`
  )
  yield github.gitdata.createCommit({user, repo, message, tree, parents})
}
