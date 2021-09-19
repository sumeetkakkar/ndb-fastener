'use strict';
const assert = require('assert');
const path = require('path');
const checkPackages = require('../../lib/tasks/check-packages');

const fixturePath = path.resolve(__dirname, '..', 'fixtures');
const bundleRootPath = path.join(fixturePath, 'test-bundle');

function errorOutputChecker() {
  let data = '';
  function onwrite(chunk) {
    data += chunk.toString();
  }
  process.stderr.write = onwrite;

  return function check(match) {
    return (typeof match === 'string') ?
      data.includes(match) :
      match.test(data);
  };
}

describe('check-packages', function () {
  const { write: stderrWrite } = process.stderr;
  afterEach(() => {
    process.stderr.write = stderrWrite;
  });

  it('should fail', function () {
    const checker = errorOutputChecker();
    const appPath = path.join(fixturePath, 'app2');
    const result = checkPackages(bundleRootPath, { cwd: appPath });
    assert.strictEqual(result, false, 'checkPackages should return false');
    assert.strictEqual(checker(/\[error\][^\s]+ Please remove following dependencies/), true, 'should log error message');
    assert.strictEqual(checker(/\[warn\][^\s]+ Please review following dev dependencies/), true, 'should log warning message');
  });

  it('should warn', function () {
    const checker = errorOutputChecker();
    const appPath = path.join(fixturePath, 'app');
    const result = checkPackages(bundleRootPath, { cwd: appPath });
    assert.strictEqual(result, true, 'checkPackages should return true');
    assert.strictEqual(checker(/\[error\][^\s]+ Please remove following dependencies/), false, 'should log error message');
    assert.strictEqual(checker(/\[warn\][^\s]+ Please review following dev dependencies/), true, 'should log warning message');
  });

});
