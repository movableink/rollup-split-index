const fs = require("fs");
const splitIndex = require("./index");

module.exports = {
  "preprocessor:split-index": ["factory", initPreprocessor]
};

initPreprocessor.$inject = ["config.files"];

function initPreprocessor(files) {
  return function(content, file, done) {
    splitIndex(file.originalPath).then(tree => {
      Promise.all(
        tree.output.map(([bundle, opts]) => {
          return bundle.generate(opts).then(generated => generated.code);
        })
      ).then(files => {
        const output = files.join("\n");
        return done(output);
      });
    });
  };
}
