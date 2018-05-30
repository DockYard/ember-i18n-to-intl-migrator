'use strict';

const codemod = require('./lib/codemod');

module.exports = function(file, api, options) {
  codemod(file, api, options);
};

