const { createFilter } = require("rollup-pluginutils");
const resolver = require("rollup-plugin-node-resolve");
const moduleHash = require("./module-hash");
const { resolve } = require("path");
const { parse } = require("acorn");

// Replace es6 imports and exports with global imports/exports
module.exports = function importExportToGlobal(options = {}) {
  const filter = createFilter(options.include, options.exclude);

  options.importName = options.importName || "__rollup_vendor";

  let entry;

  function importRewriter(line) {
    try {
      const parsed = parse(line, {
        sourceType: "module",
        ecmaVersion: 8
      }).body[0];

      // Find all import statements to rewrite them
      if (parsed.type === "ImportDeclaration") {
        const from = parsed.source.value;
        const out = [],
          destructuredSpecs = [];

        // Import statements can have multiple specifiers; for instance,
        // `import a, {b, c} from 'foo';` has three.
        parsed.specifiers.forEach(spec => {
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
      } else if (parsed.type === "ExportDefaultDeclaration") {
        // We set our default exported value as a window global with our
        // name, for convenience
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
