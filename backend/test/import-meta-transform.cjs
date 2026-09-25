// Jest runs this project's tests as CommonJS. Nest 12 includes ESM utilities
// using createRequire(import.meta.url), which must refer to the transformed file.
module.exports = function ({ types: t }) {
  return { visitor: { MemberExpression(path) {
    const object = path.node.object;
    if (t.isMetaProperty(object) && object.meta.name === 'import' &&
        object.property.name === 'meta' && t.isIdentifier(path.node.property, { name: 'url' })) {
      path.replaceWith(t.callExpression(
        t.memberExpression(t.callExpression(t.memberExpression(
          t.callExpression(t.identifier('require'), [t.stringLiteral('node:url')]),
          t.identifier('pathToFileURL')), [t.identifier('__filename')]), t.identifier('toString')), []));
    }
  } } };
};
