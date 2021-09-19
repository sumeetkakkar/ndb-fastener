'use strict';
const path = require('path');
const {
  getConfig,
  shouldSkip,
} = require('./utils');

function fasten({ cwd=process.cwd(), strict=false, skip } = {}) {
  if (shouldSkip(skip) === true) return;

  const config = getConfig(cwd);
 
  const bundlePath = require('./tasks/check-install-bundle')(config, { cwd });

  // bundlePath would end with `node_modules` (check path.basename(bundlePath))
  if (require('./tasks/check-packages')(path.dirname(bundlePath), { cwd }) === false) {
    if (strict) throw Error('Please fix the errors and try again.');
  }

  require('./tasks/fasten-bundle')(bundlePath);
}

module.exports = fasten;
