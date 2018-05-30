'use strict';

const fs = require('fs');
const defineTest = require('jscodeshift/dist/testUtils').defineTest;

module.exports = function testRunner(type) {
  let fixturesFile = `${__dirname}/../__testfixtures__/${type}.input.js`;

  defineTest(__dirname, 'lib/codemod', null, type);
};
