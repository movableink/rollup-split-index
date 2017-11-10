const importParser = require("parse-es6-imports/parser");
const resolve = require("rollup-plugin-node-resolve");
const moduleHash = require("./module-hash");

// Replace es6 imports and exports with global imports/exports
module.exports = function importExportToGlobal(input) {
  const defaultExportRegex = new RegExp(
    /^\s*export\s+default\s+([a-zA-Z_$][0-9a-zA-Z_$]*);?\s*/
  );

  return {
    transform(code, id) {
      if (id === input.id) {
        const lines = code.split("\n").map(line => {
          // Replace export lines with global variable declarations
          if (line.match(defaultExportRegex)) {
            const match = line.match(defaultExportRegex);
            return `window.${match[1]} = ${match[1]};`;
          }

          function keyFromModule(moduleName) {
            return resolve()
              .resolveId(parsed.fromModule, id)
              .then(res => moduleHash(res));
          }

          const parsed = importParser(line);

          if (parsed.defaultImport) {
            // Replace `import x from 'y';`
            return keyFromModule(parsed.fromModule).then(key => {
              return `const ${parsed.defaultImport} = __rollup_vendor['${key}'];`;
            });
          } else if (parsed.namedImports.length) {
            // Replace `import { x } from 'y';`
            return keyFromModule(parsed.fromModule).then(key => {
              return `const ${parsed.defaultImport} = __rollup_vendor['${key}'].${parsed.defaultImport};`;
            });
          } else {
            // Not an import line
            return line;
          }
        });

        return Promise.all(lines).then(lines => {
          return lines.join("\n");
        });
      }

      return code;
    }
  };
};
