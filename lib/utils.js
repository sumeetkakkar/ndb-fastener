'use strict';
const assert = require('assert');
const path = require('path');

// const DEFAULT_NDB_PATH = path.resolve(require('os').homedir(), '.ndb');

/**
{
  name
  version // latest
  global: {
    path:
  } //true, false, object
}
 * @param {String} cwd 
 * @returns 
 */
function getConfig(cwd) {
  const pkg = (() => {
    try {
      return require(path.join(cwd, 'package.json'));
    } catch(ex) {
      if (ex.code === 'MODULE_NOT_FOUND') {
        throw new Error(`Unable to load package.json from ${cwd}`);
      }
      throw ex;
    }
  })();

  const config = (() => {
    const cfg = pkg['dependencyBundle'];
    return (typeof cfg === 'string') ? { name: cfg } : { ...cfg };
  })();

  assert(config.name, `dependency bundle name is required`);

  config.global = (() => {
    if ('global' in config && !config.global) return false;
    const global = typeof config.global === 'object' && config.global || {};
    // if (!global.path) {
    //   global.path = DEFAULT_NDB_PATH;
    // }
    return global;
  })();

  return config;
}

function isCI() {
  return Boolean(  
    process.env.BUILD_NUMBER || // Jenkins, TeamCity
    process.env.CI || // Travis CI, CircleCI, Cirrus CI, Gitlab CI, Appveyor, CodeShip, dsari
    process.env.CONTINUOUS_INTEGRATION || // Travis CI, Cirrus CI
    process.env.RUN_ID // TaskCluster, dsari
  );
}

function isDevTest() {
  const nodeEnv = process.env.NODE_ENV;
  return Boolean(!nodeEnv || nodeEnv.match(/^(test|dev)/i));
}

function shouldSkip(skip) {
  switch (typeof skip) {
    case 'boolean':
      return skip;
    case 'function':
      return skip();
    default:
      return !isDevTest() || isCI();
  }
}

module.exports = {
  getConfig,
  shouldSkip,
};
