'use strict';
const assert = require('assert');
const path = require('path');
const mod = require('module');
const { promisify } = require('util');
const cp = require('child_process');
const fastenBundle = require('../../lib/tasks/fasten-bundle');

const SEPERATOR = (require('os').platform() === 'win32')?';':':';

const exec = promisify(cp.exec);

const fixturePath = path.resolve(__dirname, '..', 'fixtures');
const fixtureBundlePath = path.join(fixturePath, 'test-bundle', 'node_modules');

const orgNodePath = process.env.NODE_PATH;
function setNodePath(nodePath) {
  if (nodePath === undefined) {
    delete process.env.NODE_PATH;
  } else {
    process.env.NODE_PATH = nodePath;
  }

  return setNodePath.bind(null, orgNodePath);
}
describe('fasten-bundle', function () {
  let restoreNodePath;
  const name =  'dummy', version = '4.2.0';
  const bundlePath = `/Users/sanji/.ndb/${name}/${version}/node_modules`;
  const oldBundlePath = bundlePath.replace(version, '4.1.0');
  const npath1 = `/Users/sanji/.nvm1/node_modules`;
  const npath2 = `/Users/sanji/.nvm2/node_modules`;

  before(async function () {
    this.timeout(10000);
    await exec(`npm ci`, { cwd: path.dirname(fixtureBundlePath) });
  });

  afterEach(function () {
    if (restoreNodePath) restoreNodePath();
    restoreNodePath = undefined;
  });

  it('set bundlePath: should resolve', function () {
    fastenBundle(fixtureBundlePath);
    const app = require('../fixtures/app');
    assert.strictEqual(app.pkg1(), 'pkg1', 'Module pkg1 should resolve');
    assert.strictEqual(app.pkg2(), 'pkg2', 'Module pkg2 should resolve');
  });

  it('set bundlePath: empty NODE_PATH', function () {
    restoreNodePath = setNodePath();
    fastenBundle(bundlePath);

    assert.strictEqual(mod.globalPaths && mod.globalPaths.includes(bundlePath), true, 'bundlePath should be part of globals');
  });

  it('set bundlePath: existing NODE_PATH', function () {
    restoreNodePath = setNodePath(npath1);
    fastenBundle(bundlePath);

    assert.strictEqual(mod.globalPaths && mod.globalPaths.includes(npath1), true, 'original node path should be part of globals');
    assert.strictEqual(mod.globalPaths && mod.globalPaths.includes(bundlePath), true, 'bundlePath should be part of globals');
  });

  it('set bundlePath: existing multi NODE_PATH', function () {
    restoreNodePath = setNodePath(`${npath1}${SEPERATOR}${npath2}`);
    fastenBundle(bundlePath);

    assert.strictEqual(mod.globalPaths && mod.globalPaths.includes(npath1), true, `original node path [${npath1}] should be part of globals`);
    assert.strictEqual(mod.globalPaths && mod.globalPaths.includes(npath2), true, `original node path [${npath2}] should be part of globals`);
    assert.strictEqual(mod.globalPaths && mod.globalPaths.includes(bundlePath), true, 'bundlePath should be part of globals');
  });

  it('set bundlePath: existing NODE_PATH, update old bundlePath', function () {
    const cases = [
      [ 'start', `${oldBundlePath}${SEPERATOR}${npath1}${SEPERATOR}${npath2}`],
      [ 'end', `${npath1}${SEPERATOR}${npath2}${SEPERATOR}${oldBundlePath}`],
      [ 'middle', `${npath1}${SEPERATOR}${oldBundlePath}${SEPERATOR}${npath2}`],
    ];
    function execute(name, nodePath) {
      restoreNodePath = setNodePath(nodePath);
      fastenBundle(bundlePath);

      assert.strictEqual(mod.globalPaths && mod.globalPaths.includes(npath1), true, `[${name}] original node path [${npath1}] should be part of globals`);
      assert.strictEqual(mod.globalPaths && mod.globalPaths.includes(npath2), true, `[${name}] original node path [${npath2}] should be part of globals`);
      assert.strictEqual(mod.globalPaths && mod.globalPaths.includes(bundlePath), true, `[${name}] bundlePath should be part of globals`);
      assert.strictEqual(mod.globalPaths && mod.globalPaths.includes(oldBundlePath), false, `[${name}] old bundlePath [${oldBundlePath} should not be part of globals`);
    }
    for (const args of cases) {
      execute(...args);
    }
  });
});
