'use strict';

const CLI_NAME = 'dbm';

module.exports = {
  get CLI_NAME() { return CLI_NAME; },
  get CLI() { return `${CLI_NAME}-cli`; },
};