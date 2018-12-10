const rollup = require("rollup");
const { resolve } = require("path");
const moduleHash = require("./module-hash");
const { realpathSync } = require("fs");
const { parse } = require("acorn");

/**
 * In building the dependencies-only bundle, we want to include everything that the
 * inputFile imports, and then expose all of those imports as a window variable so
 * that the inputFile can access them.
 *
 * In order to coerce rollup to bundle all of the dependencies, we're going to
 * pretend to place the inputFile in the bundle. But we don't want the actual
 * contents of our inputFile in the bundle, so we use a transform() to completely
 * rewrite it into a new file. The first part of the file includes the same import
 * statements as the original. The second part of the file constructs an object
 * containing the imports, and exports it.
 **/

module.exports = function dependenciesOnly() {
  let entry;

  return {
    name: "dependencies-only",

    options(opts) {
      entry = realpathSync(resolve(opts.input));
    },

    transform(code, id, a) {
      try {
        id = realpathSync(id);
      } catch(_e) { /* not all will be files */ }

      // inputFile is getting replaced with a shim
      if (id !== entry) return null;

      // Parse the source into an AST and pick out the import statements
      const parsed = parse(code, { sourceType: "module", ecmaVersion: 8 });
      const imports = parsed.body.filter(n => n.type === "ImportDeclaration");

      const out = [
        "// Shim to ensure that imports get included as dependencies:",
        ""
      ];

      // Copy all import statements from entrypoint file to our output file
      imports.forEach((imp, i) => out.push(code.slice(imp.start, imp.end)));

      out.push(
        "",
        "// destructured exports append `:obj` because they ",
        "// may be different object than default",
        ""
      );

      out.push("export default {");

      imports.forEach((imp, i) => {
        const dep = imp.source.value;

        const destructuredSpecs = [];
        imp.specifiers.forEach(spec => {
          if (spec.type === "ImportDefaultSpecifier") {
            out.push(`  '${dep}': ${spec.local.name},`);
          } else {
            destructuredSpecs.push(spec.local.name);
          }
        });

        if (destructuredSpecs.length) {
          out.push(`  '${dep}:obj': { ${destructuredSpecs.join(", ")} },`);
        }
      });

      out.push("};");

      return { code: out.join("\n"), map: null };
    }
  };
};
