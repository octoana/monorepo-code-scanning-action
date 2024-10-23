const github = undefined;
const context = undefined;
const core = require("@actions/core");
core.debug = () => {};

const script = require("../changes/build-matrix.js");
const result = script(github, context, core);
console.log(JSON.stringify(result));
