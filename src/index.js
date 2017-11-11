const rollup = require("rollup");

const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");

const importExportToGlobal = require("./import-export-to-global");
const dependenciesOnly = require("./dependencies-only");
const moduleHash = require("./module-hash");

module.exports = async function splitIndex(inputFile) {
  const tree = {
    input: inputFile,
    output: [],
    dependencies: {}
  };

  // Do an initial bundling just to get dependency list
  const initialBundle = await rollup.rollup({
    input: inputFile,
    plugins: [resolve(), commonjs()]
  });

  // Last module is our entrypoint
  const input = initialBundle.modules[initialBundle.modules.length - 1];

  tree.dependencies = input.dependencies.map(dep => {
    return [dep, moduleHash(dep)];
  });

  // Output a vendor.js file containing everything imported from
  // index.js, under a global `__rollup_vendor` variable
  const vendorBundle = await rollup.rollup({
    input: inputFile,
    plugins: [resolve(), commonjs(), dependenciesOnly(input)]
  });
  tree.output.push([
    vendorBundle,
    {
      name: "__rollup_vendor",
      file: "dist/vendor.js",
      format: "iife"
    }
  ]);

  // Output an index.js file with es6 imports and exports rewritten to
  // import from globals and export to globals
  const indexBundle = await rollup.rollup({
    input: inputFile,
    plugins: [resolve(), commonjs(), importExportToGlobal(input)]
  });
  tree.output.push([
    indexBundle,
    {
      file: "dist/index.js",
      format: "es"
    }
  ]);

  return tree;
};
