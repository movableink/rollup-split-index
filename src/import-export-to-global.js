const { createFilter } = require("rollup-pluginutils");
const importParser = require("parse-es6-imports/parser");
const resolver = require("rollup-plugin-node-resolve");
const moduleHash = require("./module-hash");
const { resolve } = require("path");
const { parse } = require("acorn");

// Replace es6 imports and exports with global imports/exports
module.exports = function importExportToGlobal(options = {}) {
  var filter = createFilter(options.include, options.exclude);

  options.importName = options.importName || "__rollup_vendor";

  let entry;

  function importRewriter(line) {
    try {
      const parsed = parse(line, {
        sourceType: "module",
        ecmaVersion: 8
      }).body[0];

      if (parsed.type === "ImportDeclaration") {
        const from = parsed.source.value;
        const importType = parsed.specifiers[0].type;

        if (importType === "ImportDefaultSpecifier") {
          const name = parsed.specifiers[0].local.name;
          return `const ${name} = ${options.importName}['${from}'];`;
        } else {
          const names = parsed.specifiers.map(s => s.local.name).join(", ");
          return `const { ${names} } = ${options.importName}['${from}'];`;
        }
      } else if (parsed.type === "ExportDefaultDeclaration") {
        const name = parsed.declaration.name;
        return `window.${name} = ${name};`;
      }
    } catch (e) {
      // We don't care about parsing errors since we're going line
      // by line and some lines may not be valid in of themselves,
      // but all of the ones we care about are valid.
    }

    return line;
  }

  return {
    name: "import-export-to-global",

    options(opts) {
      entry = resolve(opts.input);
    },

    transform(code, id) {
      if (id !== entry || !filter(id)) return { code, map: null };

      const transformedCode = code
        .split("\n")
        .map(importRewriter)
        .join("\n");
      return { code: transformedCode, map: null };
    }
  };
};
