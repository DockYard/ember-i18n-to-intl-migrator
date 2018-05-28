module.exports = function(file, api, options) {
  const j = api.jscodeshift;

  function isGetThisI18n(node) {
    return (node.type === 'CallExpression')
      && (node.callee.name === 'get')
      && (node.arguments.length === 2)
      && (node.arguments[0].type === 'ThisExpression')
      && (node.arguments[1].value === 'i18n');
  }

  function isThisGetI18n(node) {
    return (node.type === 'CallExpression')
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

  source
    .find(j.VariableDeclarator)
    .filter((path) => {
      return isGetThisI18n(path.node.init);
    })
    .forEach(path => {
      j(path).replaceWith(createGetThisIntl(path.node));
    });

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

  source
    .find(j.CallExpression)
    .filter((path) => {
      return path.node.callee.type === 'MemberExpression'
        && path.node.callee.object.name === 'i18n'
        && path.node.callee.property.name === 't';
    })
    .forEach(path => {
      let memberEx = j.memberExpression(j.identifier('intl'), path.node.callee.property);
      let replacement = j.callExpression(
        memberEx,
        path.node.arguments
      );
      j(path).replaceWith(replacement);
    });

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
  return source.toSource();
}