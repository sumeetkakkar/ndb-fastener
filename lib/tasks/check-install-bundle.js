'use strict';
const path = require('path');
const cp = require('child_process');
const { CLI, CLI_NAME } = require('../constants');

function getBundlePath({ name, version, tag, repo }, { check, cwd=process.cwd() }={}) {
  const cargs = [ 'path', name ];
  if (repo) cargs.push('--repo', repo);
  if (version) cargs.push(version);
  else if (tag) cargs.push(tag); // use tag as a version
  if (check) cargs.push('--check');
  const result = cp.spawnSync(CLI, cargs, {
    cwd,
  }) || {};
  // console.log(result); // TODO:
  const { error } = result;
  if (error) {
    if (error.code === 'ENOENT') {
       throw new Error(`${CLI_NAME} is not installed. Please run "npm install ${CLI_NAME} -g".`);
    }
    throw error;
  }
  if (result.status !== 0 || (!result.stdout || result.stdout.length === 0)) {
    console.log(result.stderr && result.stderr.toString() || `Unexpected error resolving bundle. Check whether ${name} is installed.`);
    return false;
  }
  return result.stdout.toString().trim();
}

function installBundle({ name, version, tag, repo, global }, { cwd=process.cwd() }={}) {
  const cargs = [ 'install', name ];
  if (version) cargs.push(version);
  if (tag) cargs.push('--tag', tag);
  if (repo) cargs.push('--repo', repo);
  if (!global) {
    cargs.unshift('--rootdir', path.resolve(cwd, '.ndb'));
  } else if (global.path) {
    cargs.unshift('--rootdir', global.path);
  }
  const result = cp.spawnSync(CLI, cargs, {
    stdio: [ process.stdin, process.stdout, process.stderr, ],
    cwd,
  }) || {};
  // console.log(result); //TODO:
  const { error } = result;
  if (error) {
    if (error.code === 'ENOENT') {
       throw new Error(`${CLI_NAME} is not installed. Please run "npm install ${CLI_NAME} -g".`);
    }
    throw error;
  }
  if (result.status !== 0) {
    throw new Error(`Error installing bundle ${name}`);
  }
  return true;
}

function checkInstallBundle(config, options) {
  let bundlePath = getBundlePath(config, { check: true, ...options });
  if (bundlePath) return bundlePath;

  installBundle(config, options);

  return getBundlePath(config, options);
}

module.exports = checkInstallBundle;
