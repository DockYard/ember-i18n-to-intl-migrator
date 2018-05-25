#!/usr/bin/env node
'use strict';

const path = require("path");
const fs = require("fs");
const PLURAL_KEYWORDS = ["zero", "one", "few", "many", "other"];
const DIR = 'translations';

let locales = fs.readdirSync(path.join('app', 'locales'));
locales.forEach((localeName) => {
  let content = fs.readFileSync(path.join('app', 'locales', locales[0], 'translations.js'), 'utf8');
  let obj = new Function(content.replace('export default', 'return'))();
  let json = JSON.stringify(obj);
  if (!fs.existsSync(DIR)) {
    fs.mkdirSync(DIR);
  }
  fs.writeFileSync(path.join(DIR, `${localeName}.json`), transform(obj), 'utf8');
}, {});

function transform(obj) {
  let transformed = walk(obj);
  return JSON.stringify(transformed, null, 2);
}

function walk(obj) {
  // need to create pluralizedObject b/c as we iterate the keys, we don't necessarily know if the next
  // key is apart of the same translation object --> { "foo.one": "bar", "foo.other": "wee", "bar.one": "doo", "bar.two": "dee" }
  // as a result, it is hard to preserve the order unless we keep an Array of keys (for ORDER purposes) and rebuild the object.  TODO?
  let pluralizedObject = {};
  Object.keys(obj).forEach(key => {
    let value = obj[key];
    let parts = key.split('.');
    if (parts.length > 1 && PLURAL_KEYWORDS.includes(parts[parts.length - 1])) {
      // 1. check if "boo.one".  If so, build object with plural translations
      // will composePlural later
      let [plural] = parts.splice(-1);
      let keyword = parts.join('.');
      pluralizedObject[keyword] = { [plural]: value, ...pluralizedObject[keyword] };
      delete obj[key];
    } else if (typeof value === 'object' && isPluralObject(value)) {
      // 2. if pluralized value -> "boo": { "one": "baz", "two": "bar" }
      obj[key] = composePlural(value);
    } else if (typeof value === 'string') {
      obj[key] = transformTranslation(value);
    } else {
      obj[key] = walk(value);
    }
  });
  for (let key in pluralizedObject) {
    obj[key] = composePlural(pluralizedObject[key]);
  }
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

function create(obj, str, val) {
  var keys = str.split('.');

  var container;

  if (obj && typeof obj === "object") {
    container = obj;
  } else {
    container = typed(keys[0]);
  }

  var tmp = container;

  for (var k = 0, j = keys.length - 1; k < j; k++) {
    var key = keys[k];

    if (!tmp[key]) {
      tmp[key] = typed(keys[k + 1]);
    }

    tmp = tmp[key];
  }

  tmp[keys[j]] = val;

  return container;
}

function typed(key) {
  return typeof key === "number" ? [] : {};
}
