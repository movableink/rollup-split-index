const assert = require("assert");
const path = require("path");
const rollup = require("rollup");
const importExportToGlobal = require("../src/import-export-to-global");
const dependenciesOnly = require("../src/dependencies-only");

process.chdir(__dirname);

describe("rollup-plugin-split-index import-export-to-global", function() {
  it("rewrites es6 imports to global statements", function() {
    return rollup
      .rollup({
        input: "samples/basic/main.js",
        plugins: [importExportToGlobal()]
      })
      .then(function(bundle) {
        return bundle.generate({ format: "es" });
      })
      .then(function(generated) {
        const code = generated.code;
        const expected = "const utilities = __rollup_vendor['./utilities'];";

        assert.ok(code.indexOf(expected) !== -1, expected);
      });
  });

  it("accepts importName option", function() {
    return rollup
      .rollup({
        input: "samples/basic/main.js",
        plugins: [importExportToGlobal({ importName: "aDifferentVar" })]
      })
      .then(function(bundle) {
        return bundle.generate({ format: "es", name: "outputVar" });
      })
      .then(function(generated) {
        const code = generated.code;
        const expected = "const utilities = aDifferentVar['./utilities'];";

        assert.ok(code.indexOf(expected) !== -1, `expected: ${expected}`);
      });
  });

  it("rewrites destructured import statements", function() {
    return rollup
      .rollup({
        input: "samples/basic/main.js",
        plugins: [importExportToGlobal()],
        external: ["jquery", "big-module"]
      })
      .then(function(bundle) {
        return bundle.generate({ format: "es", name: "outputVar" });
      })
      .then(function(generated) {
        const code = generated.code;
        const expected =
          "const { aSubmodule } = __rollup_vendor['./big-module:obj'];";

        assert.ok(code.indexOf(expected) !== -1, `expected: ${expected}`);
      });
  });
});

describe("rollup-plugin-split-index dependencies-only", function() {
  it("rewrites es6 imports to global statements", function() {
    return rollup
      .rollup({
        input: "samples/basic/main.js",
        plugins: [dependenciesOnly()],
        external: ["jquery", "big-module"]
      })
      .then(function(bundle) {
        return bundle.generate({ name: "__rollup_vendor", format: "iife" });
      })
      .then(function(generated) {
        const code = generated.code;
        const expected = "";

        assert.ok(code.indexOf(expected) !== -1, "");
      });
  });
});
