const moduleHash = require("./module-hash");

// Replace the entrypoint with a file consisting solely of an import
// list of its dependencies, stuffed into the default export
module.exports = function dependenciesOnly(input) {
  return {
    load(id) {
      // inputFile is getting replaced with a shim
      if (id === input.id) {
        let out = input.dependencies.map((dep, i) => {
          return `import dep${i} from '${dep}';`;
        });

        out.push("const out = {};");

        input.dependencies.forEach((dep, i) => {
          out.push(`out['${moduleHash(dep)}'] = dep${i};`);
        });

        out.push("export default out;");

        return out.join("\n");
      }

      return null; // otherwise do nothing
    }
  };
};
