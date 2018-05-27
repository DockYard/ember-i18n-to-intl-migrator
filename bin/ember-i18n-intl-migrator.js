#!/usr/bin/env node
'use strict';

const chalk = require("chalk");
const path = require("path");
const argv = require('yargs').argv
const translationTransform = require('../lib/translation-transform');

try {
  translationTransform(argv.type);
} catch (e) {
  console.error(chalk.red(e.stack));
  process.exit(-1);
}
