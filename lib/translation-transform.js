const path = require("path");
const fs = require("fs");
YAML = require('yamljs');

const PLURAL_KEYWORDS = ["zero", "one", "two", "few", "many", "other"];
const DIR = 'translations';

module.exports = function(type = 'json') {
  let locales = fs.readdirSync(path.join('app', 'locales'));
  locales.forEach((localeName) => {
    let content = fs.readFileSync(path.join('app', 'locales', localeName, 'translations.js'), 'utf8');
    let obj = new Function(content.replace('export default', 'return'))();
    if (!fs.existsSync(DIR)) {
      fs.mkdirSync(DIR);
    }
    let extension = type === 'yaml' ? 'yml' : 'json';
    fs.writeFileSync(path.join(DIR, `${localeName}.${extension}`), transform(obj, type), 'utf8');
  }, {});
}

function transform(obj, type) {
  let noramlizedObj = normalizeObject(obj);
  let transformed = walk(noramlizedObj);

  let result;
  if (type === 'yaml') {
    result = YAML.stringify(transformed, 1000);
  } else {
    result = JSON.stringify(transformed, null, 2);
  }

  return result;
}

// ember-i18n support both nested objects or dot notation:
//
//   export default {
//    'user.edit.title': 'Edit User',
//    'user.followers.title.one': 'One Follower',
//    'user.followers.title.other': 'All {{count}} Followers',
//   };
//  
//   export default {
//     user: {
//       edit: {
//         title: 'Edit User',
//       },
//       followers: {
//         title: {
//           one: 'One Follower',
//           other: 'All {{count}} Followers',
//         }
//       }
//     }
//   };
//
// This function normalizes both style to the nested object one.
function normalizeObject(input) {
  let normalized = {};

  Object.keys(input).forEach(key => {
    let parts = key.split('.');
    let value = input[key];

    let currentRoot = normalized;
    let step = 0;
    while (true) {
      let currentKey = parts[step];
      
      if (step === parts.length - 1) {
        // finished constructing the nested object, apply value and exit loop
        currentRoot[currentKey] = value;
        break;
      }

      if (typeof currentRoot[currentKey] !== "object") {
        // initalize object
        currentRoot[currentKey] = {};
      }

      currentRoot = currentRoot[currentKey];
      step++;
    }
  });

  return normalized;
}

function walk(obj) {
  // need to create pluralizedObject b/c as we iterate the keys, we don't necessarily know if the next
  // key is apart of the same translation object --> { "foo.one": "bar", "foo.other": "wee", "bar.one": "doo", "bar.two": "dee" }
  // as a result, it is hard to preserve the order unless we keep an Array of keys (for ORDER purposes) and rebuild the object.  TODO?
  let pluralizedObject = {};
  Object.keys(obj).forEach(key => {
    let value = obj[key];
    let parts = key.split('.');
    if (typeof value === 'object' && isPluralObject(value)) {
      // pluralized value
      //   "abc": { "one": "foo", "two": "bar", "other": "baz" }
      obj[key] = composePlural(value);
    } else if (typeof value === 'string') {
      // translation string
      //   "abc": "bar"
      obj[key] = transformTranslation(value);
    } else {
      // nested object
      //   "abc": { "foo": { "bar": "baz" } }
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
