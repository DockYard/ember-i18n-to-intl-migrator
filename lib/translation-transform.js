const path = require("path");
const fs = require("fs");
YAML = require('yamljs');

const PLURAL_KEYWORDS = ["zero", "one", "few", "many", "other"];
const DIR = 'translations';

module.exports = function(type = 'json') {
  let locales = fs.readdirSync(path.join('app', 'locales'));
  locales.forEach((localeName) => {
    let content = fs.readFileSync(path.join('app', 'locales', localeName, 'translations.js'), 'utf8');
    let obj = new Function(content.replace('export default', 'return'))();
    let json = JSON.stringify(obj);
    if (!fs.existsSync(DIR)) {
      fs.mkdirSync(DIR);
    }
    let extension = type === 'yaml' ? 'yml' : 'json';
    fs.writeFileSync(path.join(DIR, `${localeName}.${extension}`), transform(obj, type), 'utf8');
  }, {});
}

function transform(obj, type) {
  let transformed = walk(obj);

  let result;
  if (type === 'yaml') {
    result = YAML.stringify(transformed, 1000);
  } else {
    result = JSON.stringify(transformed, null, 2);
  }

  return result;
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
  return str.replace(/{{/g, '{').replace(/}}/g, '}');
}

function isPluralObject(obj) {
  return Object.keys(obj).every(key => PLURAL_KEYWORDS.includes(key));
}

function icuSyntax(key) {
  switch(key) {
    case 'zero':
      return '=0';
    case 'one':
      return '=1';
    default:
      return key;
  }
}

function composePlural(obj) {
  let str = '{count, plural,';
  for (let key in obj) {
    let value = transformTranslation(obj[key]); // "{{count}} is greater than {{otherValue}}" =>  "# is greater than {otherValue}"
    str += ` ${icuSyntax(key)} {${value.replace("{count}", "#")}}`;
  }
  str += '}'
  return str;
}
