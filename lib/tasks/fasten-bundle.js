'use strict';
const assert = require('assert');
const path = require('path');
const mod = require('module');

function fastenBundle(bundlePath) {
  assert(bundlePath, 'Bundle path is required');
  const nodePath = process.env.NODE_PATH;
  if (nodePath) {
    if (nodePath.includes(bundlePath)) {
      // Do nothing. 
      return;
    }
    const root = (path.basename(bundlePath) === 'node_modules') ? path.dirname(path.dirname(bundlePath)) : path.dirname(bundlePath);
    if (nodePath.includes(root)) {
      const regx = new RegExp(`${root.replace(/\\/g, '\\\\').replace(/\./g,'\\.')}[\\/\\\\][^\\/\\\\]+(?:[\\/\\\\]node_modules)?`, 'g');
      process.env.NODE_PATH = nodePath.replace(regx, bundlePath);
    } else {
      process.env.NODE_PATH = `${bundlePath}${(require('os').platform() === 'win32')?';':':'}${nodePath}`;
    }
  } else {
    process.env.NODE_PATH = bundlePath;
  }
  mod._initPaths();

  // // Should be revert nach the NODE_PATH?
  // if (nodePath) {
  //   process.env.NODE_PATH = nodePath;
  // } else {
  //   delete process.env.NODE_PATH;
  // }
}

module.exports = fastenBundle;
