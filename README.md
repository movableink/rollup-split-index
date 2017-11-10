# rollup-split-index

> Splits dependency tree into the entrypoint file and all the rest.

## Install

```sh
$ yarn add rollup-split-index
# or:
$ npm install --save rollup-split-index
```

## Usage

```sh
$ node_modules/rollup-split-index/bin/rollup-split-index ./index.js
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
const jQuery = __rollup_vendor['9db3656a25060577330073bbda43fa23']
...
window.MyApp = MyApp;
```

You should be able to load both files in script tags and then reference the default exported variable:

```html
<script src="./dist/vendor.js"></script>
<script src="./dist/index.js"></script>
<script>
  console.log(window.MyApp);
</script>
```

## License

MIT
