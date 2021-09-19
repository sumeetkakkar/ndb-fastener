'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { inspect: { colors } } = require('util');

function loadJsonFile(file) {
  try {
    // require(pkgfile) will cache the content. Directly reading it instead
    const content = fs.readFileSync(file);
    return JSON.parse(content);
  } catch(ex) {
    throw new Error(`Unable to read ${file} [${ex.message}] [${ex.code}]`);
  }
} 

function loadPackages(pkgfile) {
  const pkg = loadJsonFile(pkgfile);
  return pkg.dependencies && Object.keys(pkg.dependencies) || [];
}

function loadPackagesFromLockFile(packageLock) {
  const deps = new Set();
  const devDeps = new Set();
  function readDependencies(dependencies) {
    if (!dependencies) return;
    for (const dep of Object.keys(dependencies)) {
      const details = dependencies[dep];
      details.dev === true ? devDeps.add(dep) : deps.add(dep);
      readDependencies(details.dependencies);
    }
  }
  const pkgLock = loadJsonFile(packageLock);
  readDependencies(pkgLock.dependencies);
  return [ deps, devDeps ];
}

const logPackages = (function packageLogger() {
  const colorMarker = color => `\x1b[${color[0]}m`;
  const RESET = colorMarker(colors.reset);
  const FgRed = colorMarker(colors.red);
  const FgYellow = colorMarker(colors.yellow);
  const FgCyan = colorMarker(colors.cyan);
  const FgWhite = colorMarker(colors.white);

  return function logPackages(packages, isDev=false) {
    const help = `"npm ls [[<@scope>/]<pkg> ...]" command can be used to determine how they are being included`;
    if (isDev) {
      console.warn(`${FgYellow}[warn]${FgCyan}`, `Please review following dev dependencies.`, help, RESET);
    } else {
      console.error(`${FgYellow}[error]${FgRed}`, `Please remove following dependencies.`, help, RESET);
    }

    for(const pkg of packages) {
      console.warn(`\t${FgWhite}*${FgYellow}`, pkg, RESET);
    }
  };
})();


function checkPackages(bundleRoot, { cwd=process.cwd() }) {
  assert(bundleRoot, 'Bundle root path is required');
  const lockfile = path.resolve(cwd, 'package-lock.json');
  if (!fs.existsSync(lockfile)) return;
  const [ deps, devDeps ] = loadPackagesFromLockFile(lockfile);

  const main = [];
  const dev = [];

  const bundlePackages = loadPackages(path.resolve(bundleRoot, 'package.json'));
  for (const pkgName of bundlePackages) {
    if (deps.has(pkgName)) {
      main.push(pkgName);
    } else if (devDeps.has(pkgName)) {
      dev.push(pkgName);
    }
  }

  if (dev.length > 0) {
    logPackages(dev, true);
  }
  if (main.length > 0) {
    logPackages(main);
    return false;
  }

  return true;
}

module.exports = checkPackages;
