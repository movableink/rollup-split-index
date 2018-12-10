const { createFilter } = require("rollup-pluginutils");
const resolver = require("rollup-plugin-node-resolve");
const moduleHash = require("./module-hash");
const { resolve } = require("path");
const { parse } = require("acorn");
const { realpathSync } = require("fs");
const MagicString = require("magic-string");

function importToGlobal(node, options) {
  const from = node.source.value;
  const out = [],
        destructuredSpecs = [];

  // Import statements can have multiple specifiers; for instance,
  // `import a, {b, c} from 'foo';` has three.
  node.specifiers.forEach(spec => {
    if (spec.type === "ImportDefaultSpecifier") {
      const name = spec.local.name;
      out.push(`const ${name} = ${options.importName}['${from}'];`);
    } else {
      destructuredSpecs.push(spec.local.name);
    }
  });

  // If using destructured import statements, we need to read from
  // the key with `:obj` appended. We have to differentiate because
  // es6 destructured imports and destructured variable declarations
  // are not equivalent.
  if (destructuredSpecs.length) {
    const names = destructuredSpecs.join(", ");
    out.push(
      `const { ${names} } = ${options.importName}['${from}:obj'];`
    );
  }

  return out.join("\n");
}

function exportToGlobal(node) {
  // We set our default exported value as a window global with our
  // name, for convenience
  const name = node.declaration.name;
  return `window.${name} = ${name};`;
}

// Replace es6 imports and exports with global imports/exports
module.exports = function importExportToGlobal(options = {}) {
  const filter = createFilter(options.include, options.exclude);

  options.importName = options.importName || "__rollup_vendor";

  let entry;

  return {
    name: "import-export-to-global",

    options(opts) {
      entry = realpathSync(resolve(opts.input));
    },

    transform(code, id) {
      try {
        id = realpathSync(id);
      } catch(_e) { /* not all will be files */ }

      if (id !== entry || !filter(id)) return { code, map: null };

      const parsed = parse(code, {
        sourceType: "module",
        ecmaVersion: 8
      });

      const output = new MagicString(code);

      parsed.body.forEach(node => {
        if (node.type === "ExportDefaultDeclaration") {
          output.overwrite(node.start, node.end, exportToGlobal(node));
        } else if (node.type === "ImportDeclaration") {
          output.overwrite(node.start, node.end, importToGlobal(node, options));
        }
      });

      return {
        code: output.toString(),
        map: output.generateMap({ source: entry }).toString()
      };
    }
  };
};
