const yaml = require("yaml");

function run(github, context, core) {
  const raw_projects = process.env.projects;
  const raw_extra_globs = process.env.extra_globs;

  if (!raw_projects) {
    core.setFailed("projects is required");
    return;
  }

  const projects = JSON.parse(raw_projects);

  core.debug(projects);
  core.debug(typeof projects);
  core.debug(Object.entries(projects));

  const extra_globs = raw_extra_globs != "" ? yaml.parse(raw_extra_globs) : {};

  const filters = {};

  const aliases = {
    "java": "java-kotlin",
    "javascript": "javascript-typescript",
    "typescript": "javascript-typescript",
    "c": "c-cpp",
    "cpp": "c-cpp",
  };

  // which filenames to include in the analysis if they are changed, per language
  // this is configurable (adding new globs) using an Action input
  const globs = {
    csharp: [
      "**/*.aspx",
      "**/*.cs",
      "**/*.cshtml",
      "**/*.csproj",
      "**/packages.config",
      "**/*.razor",
      "**/*.sln",
      "**/*.xaml",
      "**/*.xml",
    ],
    python: [
      "**/*.py",
      "**/pyproject.toml",
      "**/Pipfile",
      "**/Pipfile.lock",
      "**/requirements.txt",
      "**/requirements-dev.txt",
      "**/requirements.in",
      "**/requirements-dev.in",
      "**/setup.cfg",
    ],
    go: ["**/*.go", "**/go.mod", "**/go.sum"],
    "java-kotlin": [
      "**/*.java",
      "**/*.gradle",
      "**/*.kt",
      "**/*.kts",
      "**/*.jar",
    ],
    "javascript-typescript": [
      "**/*.js",
      "**/*.jsx",
      "**/*.mjs",
      "**/*.es",
      "**/*.es6",
      "**/*.ts",
      "**/*.tsx",
      "**/*.mts",
      "**/*.cts",
      "**/*.htm",
      "**/*.html",
      "**/*.xhtm",
      "**/*.xhtml",
      "**/*.vue",
      "**/*.hbs",
      "**/*.ejs",
      "**/*.njk",
      "**/*.json",
      "**/*.yaml",
      "**/*.yml",
      "**/*.raml",
      "**/*.xml",

      "**/package.json",
      "**/yarn.lock",
      "**/package-lock.json",
    ],
    ruby: ["**/*.rb", "**/*.erb", "**/Gemfile", "**/Gemfile.lock", "**/*.gemspec"],
    swift: ["**/*.swift"],
    "c-cpp": [
      "**/*.c",
      "**/*.cpp",
      "**/*.h",
      "**/*.hpp",
      "**/*.cc",
      "**/*.cxx",
      "**/*.hh",
      "**/*.hxx",
      "**/*.c++",
      "**/*.h++",
      "**/*.inl",
      "**/*.pch",
      "**/*.gch",
    ],
  };

  for (const [language, globs] of Object.entries(extra_globs)) {
    const resolved_language = aliases[language] ?? language;
    filters[resolved_language] ??= [];
    filters[resolved_language].push(...globs);
  }

  for (const [language, lang_data] of Object.entries(projects)) {
    const resolved_language = aliases[language] ?? language;

    const lang_globs = globs[resolved_language] ?? ["**/*"];

    const project_entries = lang_data.projects;

    for (const [project, project_data] of Object.entries(project_entries)) {
      for (const path of project_data.paths) {
        filters[project] ??= [];
        filters[project].push(...lang_globs.map((glob) => `${path}/${glob}`));
      }
    }
  }

  return yaml.stringify(filters);
}

module.exports = (github, context, core) => {
  return run(github, context, core);
};
