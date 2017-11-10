const crypto = require("crypto");

module.exports = function moduleHash(path) {
  return crypto
    .createHash("md5")
    .update(path)
    .digest("hex");
};
