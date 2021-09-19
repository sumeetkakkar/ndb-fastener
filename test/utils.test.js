'use strict';
const assert = require('assert');
const path = require('path');
const { 
  getConfig,
  shouldSkip,
} = require('../lib/utils');
const pkg = require('./fixtures/app/package.json');

const restoreEnvs = [];
function envHandler(name) {
  const origVal = process.env[name];
  const setEnv = (val) => {
    if (val === undefined) delete process.env[name];
    else process.env[name] = val;
  };

  // pust restore env handler
  restoreEnvs.push(setEnv.bind(undefined, origVal));
  return setEnv;
}

describe('utils', function () {
  const cwd = path.resolve(__dirname, 'fixtures', 'app');
  const orgDepBundleCfg = pkg['dependencyBundle'];
  let restoreConfig;

  function setConfig(cfg) {
    pkg['dependencyBundle'] = cfg;
    return setConfig.bind(null, orgDepBundleCfg);
  }

  afterEach(function () {
    if (restoreConfig) restoreConfig();
    restoreConfig = undefined;
    while (restoreEnvs.length > 0) {
      restoreEnvs.pop()();
    }
  });

  it('getConfig: no config - throws', function () {
    restoreConfig = setConfig();

    assert.throws(() => {
      getConfig(cwd);
    }, /name is required/, 'getConfig should throw when dependency bundle config is not defined');
  });

  it('getConfig: missing name in config - throws', function () {
    restoreConfig = setConfig({
      version: '4.2.0'
    });

    assert.throws(() => {
      getConfig(cwd);
    }, /name is required/, 'getConfig should throw when name is not included in dependency bundle config');
  });

  it('getConfig: config value is string', function () {
    restoreConfig = setConfig('dummy2');

    const config = getConfig(cwd);
    assert.strictEqual(config.name, 'dummy2', 'bundle name should be the configured string');
    assert.strictEqual(config.global && typeof config.global, 'object', 'global config option should be defaulted to an object');
  });

  it('getConfig: config value has global: false', function () {
    restoreConfig = setConfig({
      name: 'dummy2',
      global: false
    });

    const config = getConfig(cwd);
    assert.strictEqual(config.name, 'dummy2', 'bundle name should be part of the config');
    assert.strictEqual(config.global, false, 'global config option should be set as false');
  });

  it('getConfig: config value has global set with path', function () {
    restoreConfig = setConfig({ ...orgDepBundleCfg, global: { path: __dirname } });

    const config = getConfig(cwd);
    assert.strictEqual(config.name, orgDepBundleCfg.name, 'bundle name should be part of the config');
    assert.strictEqual(config.version, orgDepBundleCfg.version, 'bundle version should be part of the config');
    assert.strictEqual(config.global && config.global.path, __dirname, 'global config option should contain path for installing dependency bundle');
  });

  it('shouldSkip: do not skip for dev/test', function () {
    const setNodeEnv = envHandler('NODE_ENV');
    assert.strictEqual(shouldSkip(), false, `should not skip if NODE_ENV is not set`);
    setNodeEnv('dev');
    assert.strictEqual(shouldSkip(), false, 'should not skip if NODE_ENV is set to dev');
    setNodeEnv('DEV');
    assert.strictEqual(shouldSkip(), false, 'should not skip if NODE_ENV is set to DEV');
    setNodeEnv('test');
    assert.strictEqual(shouldSkip(), false, 'should not skip if NODE_ENV is set to test');
    setNodeEnv('PROD');
    assert.strictEqual(shouldSkip(), true, 'should not skip if NODE_ENV is set to PROD');
  });

  it('shouldSkip: skip for CI', function () {
    const setNodeEnv = envHandler('BUILD_NUMBER');
    assert.strictEqual(shouldSkip(), false, `should not skip if BUILD_NUMBER is not set`);
    setNodeEnv('12345');
    assert.strictEqual(shouldSkip(), true, 'should not skip if NODE_ENV is set to dev');
  });

  it('shouldSkip: skip option', function () {
    assert.strictEqual(shouldSkip(), false, `should not skip by default`);
    assert.strictEqual(shouldSkip(true), true, 'should not skip if boolean true is passed');
    assert.strictEqual(shouldSkip(false), false, 'should skip if boolean false is passed');
    assert.strictEqual(shouldSkip(() => true), true, 'should skip if the input is a function and it returns true');
    assert.notStrictEqual(shouldSkip(() => 'true'), true, 'should not skip if the input is a function and it does not return boolean true');
    assert.strictEqual(shouldSkip('true'), false, 'should ignore string input');
    assert.strictEqual(shouldSkip(1), false, 'should ignore number input');
  });
});
