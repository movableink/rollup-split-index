const rollup = require("rollup");
const { resolve } = require("path");
const moduleHash = require("./module-hash");
const { parse } = require("acorn");

// Replace the entrypoint with a file consisting solely of an import
// list of its dependencies, stuffed into the default export
module.exports = function dependenciesOnly() {
  let options, entry;
  return {
    name: "dependencies-only",

    options(opts) {
      options = Object.assign({}, opts);
      options.plugins = opts.plugins.filter(
        plugin => plugin.name !== "dependencies-only"
      );
      entry = resolve(options.input);
    },

    async transform(code, id, a) {
      // inputFile is getting replaced with a shim
      if (id === entry) {
        const parsed = parse(code, { sourceType: "module", ecmaVersion: 8 });
        const imports = parsed.body.filter(n => n.type === "ImportDeclaration");

        const dependencies = imports.map(imp => imp.source.value);

        let out = dependencies.map((dep, i) => {
          return `import dep${i} from '${dep}';`;
        });

        out.push("const __dependenciesOut = {};");

        dependencies.forEach((dep, i) => {
          out.push(`__dependenciesOut['${dep}'] = dep${i};`);
        });

        out.push("export default __dependenciesOut;");

        return out.join("\n");
      }

      return null; // otherwise do nothing
    }
  };
};
