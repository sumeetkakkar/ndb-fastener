'use strict';
const assert = require('assert');
const { fakeSpawnSync } = require('../fixtures/fake-spawn');
const { CLI } = require('../../lib/constants');
const checkInstallBundle = require('../../lib/tasks/check-install-bundle');

describe('check-install-bundle', function () {
  const cwd = process.cwd();
  let sandbox;

  afterEach(function () {
    if (sandbox) sandbox.restore();
    sandbox = undefined;
  });

  function fakeSpawn(onPathCommand, onInstallCommand) {
    sandbox = fakeSpawnSync(function onspawn(cmd, cargs=[]) {
      assert.strictEqual(cmd, CLI, `command should be '${CLI}'`);
      if (cargs.includes('path')) {
        return onPathCommand.call(this, cargs);
      } else if (cargs.includes('install')) {
        return onInstallCommand.call(this, cargs);
      } else {
        assert.fail(`Unexpected command arguments in "${cmd} ${cargs.join(' ')}"`);
      }
    });
  }

  it('faked check and install bundle', function () {
    const name =  'dummy';
    const version = '4.2.0';
    const repo = 'https://github.com/bundles';
    const config = {
      name,
      version,
      tag: 'latest',
      repo,
      global: false,
    };
    const bundlePath = `/Users/sanji/.ndb/${name}/${version}/node_modules`;
    const callCounts = { path: 0, install: 0 };
    function onPathCommand(_cargs) {
      const { stdout, stderr } = this;
      callCounts.path++;
      if (callCounts.path === 1) {
        stderr.write(`[error] Bundle ${name} not installed. Please install it first`);
        return { status: 1 };
      }
      stdout.write(bundlePath);
    }
    function onInstallCommand(cargs) {
      const { stdout, stderr } = this;
      callCounts.install++;
      console.log(cargs);
      assert.strictEqual(cargs.includes(name), true, `Command args should contain name "${cargs.join(' ')}"`);
      assert.strictEqual(cargs.includes(version), true, `Command args should contain version "${cargs.join(' ')}"`);
      assert.strictEqual(cargs.includes(repo), true, `Command args should contain repo "${cargs.join(' ')}"`);

      stderr.write(`some stderr\n`);
      stdout.write(`some stdout\n`);
    }
    fakeSpawn(onPathCommand, onInstallCommand);
    checkInstallBundle(config, { cwd });
    assert.strictEqual(callCounts.path, 2, `path command should be called 2 times`);
    assert.strictEqual(callCounts.install, 1, `install command should be called 1 time`);
  });

});
