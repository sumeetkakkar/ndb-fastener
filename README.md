> Node.js dependency bundle fastener


This enables developers to use dependency bundles in the development environment.

It internally performs following tasks:

a) Checks whether `dbm-cli` is installed, and uses it to check and install the latest bundle.

b) Reviews package-lock.json of the application to check for direct inclusion of bundled dependencies. 
Error is thrown if any of the bundled dependencies gets included directly as an application dependency. [npm-ls](https://docs.npmjs.com/cli/v7/commands/npm-ls) command should be used to review the conflicting dependencies for fixing the inclusion.

c) The dependency bundle path is included as the global path. This leverages NODE_PATH env.

## Installation
```
$ npm install https://github.com/sumeetkakkar/ndb-fastener.git --save-dev
# $ npm install ndb-fastener --save-dev
```

## Usage

Include the following as the first line in the application code
```
try {
  // Assuming deployed as dev dependency, ignore if the module is not resolved.
  // Internally it will check NODE_ENV. Please also review `skip` option.
  require('ndb-fastener')();
} catch (e) {
  if (e.code !== 'MODULE_NOT_FOUND') throw e;
}
```

## Options

* `strict`: {Boolean} [Optional] Strict mode will cause exceptions to be thrown if any global dependency (direct/indirect) is also found under application root. Default value is `false`. [TODO:]
* `cwd`: {String} [Optional] Working directory where application's package.json etc. are expected. Default value is `process.cwd()`.
* `skip`: {Boolean|Function} [Optional] Conditionally skip the processing. Expects boolean value or a function returning boolean (sync). By default processing is skipped based of the standard envs set by CIs, and based on the value of process.env.NODE_ENV (dev or test). Ex: { skip: process.env.NODE_ENV === 'development' }

## Configuration

Dependency bundle configuration for an app is read from the application's package.json.

Example configuration:
```
{
...
  "dependencyBundle": {
    "name": "<name>",
    "version": "<semver>"
  },
...
}
```

### Configuration options

* `name`: [String] Name of the bundle.
* `version`: [String] [Optional] Semver for the bundle. Semver is resolved to determine the latest version of the dependency bundle to use.
* `tag`: [String] [Optional] This can be used as an alternative to `version`. Refer https://github.com/sumeetkakkar/dbm#git
* `repo`: [String] [Optional]: Github repo. Refer https://github.com/sumeetkakkar/dbm#git for this option. This can alternately be set in the `.dbmrc` file. Refer section `Using .dbmrc`.
* `global`: [Boolean/Object] [Optional] Default value is `true`.
  * `false`: Checks and installs dependency bundle under `<AppRoot>/.ndb`.
  * `{ "path": "<bundle-path>" }`: Path specified in this config is used for checking and installing dependency bundle.

### Using .dbmrc

[dbm-cli](https://github.com/sumeetkakkar/dbm) is used for installing dependency bundle, the configuration related to source of bundle should be managed in [.dbmrc](https://github.com/sumeetkakkar/dbm#git).
