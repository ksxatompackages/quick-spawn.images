# Auto Image Creator
[![Build Status](https://travis-ci.org/ksxatompackages/quick-spawn.images.svg?branch=master)](https://travis-ci.org/ksxatompackages/quick-spawn.images)
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![dependencies status](https://david-dm.org/ksxatompackages/quick-spawn.images.svg)](https://david-dm.org/ksxatompackages/quick-spawn.images#info=dependencies)
[![devDependencies status](https://david-dm.org/ksxatompackages/quick-spawn.images/dev-status.svg)](https://david-dm.org/ksxatompackages/quick-spawn.images#info=devDependencies)
[![license](https://img.shields.io/npm/l/promise-set.svg)](http://spdx.org/licenses/MIT)

## Target

 * Repo: [quick-spawn](https://github.com/ksxatompackages/quick-spawn)

 * Branch: auto-images

 * Directory: `/docs/images/badges`

## Usage

### Development Environment

#### Building & Testing

##### Setup environment

```bash
npm install && npm install --only=dev
```

##### Building

```bash
npm run build
```

##### Testing

```bash
npm test
```

#### Preview

The following scripts create `/.preview.html` which shows every created artifacts
 - `npm run preview`
 - `npm run build`
 - `npm run test` (or `npm test`)

If `/sh/previewer.sh` is a file, the file will run as a bash script with `$1` is path to `/.preview.html`

### Deployment Environment

#### Branch vs Tag

If you push changes to a branch, CI tools will test only (by `npm test`)

If you push tags, CI tools will do both test and deploy

There're 3 types of releases depend on tag suffix
 - `-alpha`: Draft Release
 - `-beta`: Prerelease
 - no suffix: Official & Stable Release

Deployment is vary, depends on which environment variable is turned on

#### GitHub Release

This type of deployment requires `GITHUB_RELEASE_OAUTH`

#### Gist Repository

This type of deployment requires 3 environment variables
 - `RELEASE_GIST` is set to `TRUE`
 - `GIST_ID`
 - `GIST_TOKEN`

#### GitHub Repository Commit

This type of deployment requires 4 environment variables
 - `TARGET_GITHUB_RELEASE_OAUTH` (optional, default to `GITHUB_RELEASE_OAUTH`)
 - `TARGET_GITHUB_REPO_OWNER`
 - `TARGET_GITHUB_REPO_NAME`
 - `TARGET_GITHUB_REPO_BRANCH`

## License

[MIT](./LICENSE.md)
