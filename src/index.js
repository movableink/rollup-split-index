const rollup = require("rollup");

const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");

const importExportToGlobal = require("./import-export-to-global");
const dependenciesOnly = require("./dependencies-only");

module.exports = async function splitIndex(inputFile) {
  // Do an initial bundling just to get dependency list
  const initialBundle = await rollup.rollup({
    input: inputFile,
    plugins: [resolve(), commonjs()]
  });

  // Last module is our entrypoint
  const input = initialBundle.modules[initialBundle.modules.length - 1];
  console.log("Found Dependencies:", input.dependencies);

  // Output a vendor.js file containing everything imported from
  // index.js, under a global `__rollup_vendor` variable
  const vendorBundle = await rollup.rollup({
    input: inputFile,
    plugins: [resolve(), commonjs(), dependenciesOnly(input)]
  });
  await vendorBundle.write({
    name: "__rollup_vendor",
    file: "dist/vendor.js",
    format: "iife"
  });
  console.log("Wrote vendor file to dist/vendor.js");

  // Output an index.js file with es6 imports and exports rewritten to
  // import from globals and export to globals
  const indexBundle = await rollup.rollup({
    input: inputFile,
    plugins: [resolve(), commonjs(), importExportToGlobal(input)]
  });
  await indexBundle.write({
    file: "dist/index.js",
    format: "es"
  });
  console.log("Wrote main file to dist/index.js");
};
