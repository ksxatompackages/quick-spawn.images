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
const FILEBLOBMODE = '100644'

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
  const {object: {sha: baseRefSHA}} = yield github.gitdata.getReference({user, repo, ref})
  info('Base Reference SHA', baseRefSHA)
  const {sha: baseCommitSHA} = yield github.gitdata.getCommit({user, repo, sha: baseRefSHA})
  info('Base Commit SHA', baseCommitSHA)
  const parents = [baseCommitSHA]
  const {sha: baseTreeSHA, tree: baseTree} = yield github.gitdata.getTree({user, repo, sha: baseCommitSHA})
  info('Base Tree SHA', baseTreeSHA)
  info({baseTree, baseTreeSHA})
  info(`Reading ${ARTIFACTS_DIRECTORY}`)
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
  info('listreponse', listreponse)
  const listpath = listreponse.map(
    ({item, sha}) =>
      [join(TARGET_GITHUB_REPO_DIRECTORY, item), sha]
  )
  const diffTree = listpath.map(
    ([path, sha]) => ({mode: FILEBLOBMODE, type: 'blob', path, sha})
  )
  const restTree = baseTree.filter(
    ({path}) => listpath.every(([diff]) => path !== diff)
  )
  const resultTree = [...restTree, ...diffTree]
  info({listpath, diffTree, restTree, baseTree, resultTree})
  const {sha: tree} = yield github.gitdata.createTree({tree: resultTree, base_tree: baseTreeSHA, user, repo})
  info('New Tree SHA', tree)
  const message = (
    `Update /${TARGET_GITHUB_REPO_DIRECTORY} to ${GIT_REPO_TAG}\n * Branch: ${repo}\n * Done automatically`
  )
  const {sha} = yield github.gitdata.createCommit({user, repo, message, tree, parents})
  info('New Commit SHA', sha)
  yield github.gitdata.updateReference({user, repo, ref, sha})
}
