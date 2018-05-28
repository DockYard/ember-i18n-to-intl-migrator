#!/usr/bin/env node
'use strict';

const chalk = require("chalk");
const path = require("path");
const argv = require('yargs').argv
const translationTransform = require('../lib/translation-transform');

try {
  translationTransform(argv.type);
  console.log(chalk.yellow("Your new translations have been stored in /translations, but your old translation files have not been removed. Please review the result and delete the old translation files if satisfied."));
} catch (e) {
  console.error(chalk.red(e.stack));
  process.exit(-1);
}
