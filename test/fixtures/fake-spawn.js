'use strict';
const sinon = require('sinon');
const cp = require('child_process');
const { PassThrough } = require('stream');

function fakeSpawnSync(onspawn=()=>{}) {
  const sandbox = new sinon.createSandbox();
  sandbox.replace(cp, 'spawnSync', (cmd, cargs, { cwd, stdio=[] } = {}) => {
    const [ istdin, istdout, istderr ] = stdio;
    function isStream(strm) {
      return strm && typeof strm.pipe === 'function';
    }

    const output = {
      pid: 240,
      status: 0,
      stdin: undefined,
      stdout: undefined,
      stderr: undefined,
    };

    function constructStream(output, prop) {
      return new PassThrough().on('data', (chunk) => {
        output[prop] = chunk + (output[prop] || '');
      });
    }

    const context = {
      stdin: isStream(istdin) && istdin || constructStream(output, 'stdin'),
      stdout: isStream(istdout) && istdout || constructStream(output, 'stdout'),
      stderr: isStream(istderr) && istderr || constructStream(output, 'stderr'),
    };

    Object.assign(output, onspawn.call(context, cmd, cargs));
    return output;
  });
  return sandbox;
}

module.exports = {
  fakeSpawnSync
};
