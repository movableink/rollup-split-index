# rollup-split-index

> Splits dependency tree into the entrypoint file and all the rest.

The purpose of this module is to use rollup to bundle all dependencies into a single file while leaving the `index.js` file human-readable (and human-editable). It does this with two plugins; `dependenciesOnly` can be used while generating `dist/vendor.js` and `importExportToGlobal` can be used while generating `dist/index.js`.

## Install

```sh
$ yarn add rollup-split-index
# or:
$ npm install --save rollup-split-index
```

## Usage

Your rollup.config.js file can look like this:
```javascript
const config = require("./package.json");
const rollup = require("rollup");

const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");

const {
  importExportToGlobal,
  dependenciesOnly
} = require("rollup-split-index");

const inputFile = config.main; // likely index.js

module.exports = [
  {
    input: inputFile,
    plugins: [resolve(), commonjs(), dependenciesOnly()],
    output: {
      name: importExportToGlobal.referenceName,
      file: "dist/vendor.js",
      format: "iife"
    }
  },
  {
    input: inputFile,
    plugins: [resolve(), commonjs(), importExportToGlobal()],
    output: {
      file: "dist/index.js",
      format: "es"
    }
  }
];

```

You can then run rollup as usual with:
```sh
$ node_modules/.bin/rollup -c rollup.config.js
```

This will load `index.js`, trace its dependency tree including `node_modules`, and bundle all dependencies into `dist/vendor.js`. The `vendor.js` file will export a `__rollup_vendor` object referencing all of the imports.

In addition, this will transform `index.js` by rewriting es6 imports and exports to global declarations. For example:

```javascript
import jQuery from 'jquery';
...
export default MyApp
```

becomes:

```javascript
const jQuery = __rollup_vendor['jquery']
...
window.MyApp = MyApp;
```

You should then be able to load both files in script tags and then reference the default exported variable:

```html
<script src="./dist/vendor.js"></script>
<script src="./dist/index.js"></script>
<script>
  console.log(window.MyApp);
</script>
```

## License

MIT
