module.exports = function(file, api, options) {
  const j = api.jscodeshift;

  function isGetThisI18n(node) {
    return node && (node.type === "CallExpression")
      && node.callee.name === "get"
      && node.arguments.length === 2
      && node.arguments[0].type === "ThisExpression"
      && node.arguments[1].value === "i18n";
  }

  function isThisGetI18n(node) {
    return node && (node.type === 'CallExpression')
      && (node.callee.type === 'MemberExpression')
      && (node.callee.object.type === 'ThisExpression')
      && (node.callee.property.name === 'get')
      && (node.arguments.length === 1)
      && (node.arguments[0].value === 'i18n');
  }

  function createGetThisIntl(node) {
    let id = j.identifier('intl');
    let init = j.callExpression(node.init.callee, [node.init.arguments[0], j.stringLiteral('intl')]);
    return j.variableDeclarator(id, init);
  }

  // i18n: service();
  let source = j(file.source);
  source
    .find(j.ObjectExpression)
    .filter(path => {
      return path.node.properties.some(prop => prop.key.name === 'i18n');
    })
    .forEach(path => {
      let properties = path.node.properties.map(prop => {
        if (prop.key.name === 'i18n') {
          prop.key = j.identifier('intl');
        }
        return prop;
      })
      j(path).replaceWith(j.objectExpression(properties));
    })

  // let x = get(this, 'i18n'); --> let intl = get(this, 'intl')
  source
    .find(j.VariableDeclarator)
    .filter((path) => {
      return isGetThisI18n(path.node.init);
    })
    .forEach(path => {
      j(path).replaceWith(createGetThisIntl(path.node));
    });

  // let x = this.get('i18n'); --> let intl = this.get('intl')
  source
    .find(j.VariableDeclarator)
    .filter((path) => {
      return isThisGetI18n(path.node.init);
    })
    .forEach(path => {
      j(path).replaceWith(createGetThisIntl(path.node));
    });

  source
    .find(j.MemberExpression)
    .filter((path) => {
      return path.node.object.type === 'ThisExpression' && path.node.property.name === 'i18n';
    })
    .forEach(path => {
      j(path).replaceWith(
        j.memberExpression(path.node.object, j.identifier('intl'))
      );
    });

  // this.get('i18n');
  source
    .find(j.CallExpression)
    .filter((path) => {
      return path.node.callee.type === 'MemberExpression'
        && path.node.callee.object.type === 'ThisExpression'
        && path.node.callee.property.name === 'get'
        && path.node.arguments[0].value === 'i18n';
    })
    .forEach(path => {
      let replacement = j.callExpression(
        path.node.callee,
        [j.stringLiteral('intl')]
      );
      j(path).replaceWith(replacement);
    });

  // get(this, 'i18n')
  source
    .find(j.CallExpression)
    .filter((path) => {
      return path.node.callee.type === 'Identifier'
        && path.node.callee.name === 'get'
        && path.node.arguments.length === 2
        && path.node.arguments[0].type === 'ThisExpression'
        && path.node.arguments[1].value === 'i18n';
    })
    .forEach(path => {
      let replacement = j.callExpression(
        path.node.callee,
        [j.stringLiteral('intl')]
      );
      j(path).replaceWith(replacement);
    });

  return source.toSource({ quote: 'single' });
}
