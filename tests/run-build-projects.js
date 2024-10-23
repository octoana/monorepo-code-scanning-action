const github = undefined;
const context = undefined;
const core = require("@actions/core");

const script = require("../changes/build-projects-from-xml.js");
const _ = script(github, context, core);
