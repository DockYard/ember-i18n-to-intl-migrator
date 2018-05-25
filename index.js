#!/usr/bin/env node
'use strict';

const path = require("path");
const fs = require("fs");
const dotNotes = require("dot-notes");
const PLURAL_KEYWORDS = ["zero", "one", "few", "many", "other"];
const dir = 'translations';

let locales = fs.readdirSync(path.join('app', 'locales'));
locales.forEach((localeName) => {
  let content = fs.readFileSync(path.join('app', 'locales', locales[0], 'translations.js'), 'utf8');
  let obj = new Function(content.replace('export default', 'return'))();
  let json = JSON.stringify(obj);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  let expanded = Object.keys(obj).reduce((accum, key) => {
    return dotNotes.create(accum, key, obj[key]);
  }, {});
  fs.writeFileSync(path.join(dir, `${localeName}.json`), transform(expanded), 'utf8');
}, {});

function transform(obj) {
  let transformed = walk(obj);
  return JSON.stringify(transformed, null, 2);
}

function walk(obj) {
  Object.keys(obj).forEach(key => {
    let value = obj[key];
    if (typeof value === 'string') {
      obj[key] = transformTranslation(value);
    } else {
      if (isPluralObject(value)) {
        obj[key] = composePlural(value);
      } else {
        obj[key] = walk(value);
      }
    }
  })
  return obj;
}

function transformTranslation(str) {
  return str.replace('{{', '{').replace('}}', '}');
}

function isPluralObject(obj) {
  return Object.keys(obj).every(key => PLURAL_KEYWORDS.includes(key));
}

function composePlural(obj) {
  let str = '{count, plural,';
  for (let key in obj) {
    let value = transformTranslation(obj[key]); // "{{count}} is greater than {{otherValue}}" =>  "# is greater than {otherValue}"
    str += ` ${key} {${value.replace("{count}", "#")}}`;
  }
  str += '}'
  return str;
}

