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

  const extra_globs = raw_extra_globs != "" ? JSON.parse(raw_extra_globs) : {};

  const filters = {};

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
    java: ["**/*.java", "**/*.gradle", "gradle.*", "**/*.kt", "**/*.jar"],
    "java-kotlin": [
      "**/*.java",
      "**/*.gradle",
      "**/*.kt",
      "**/*.kts",
      "**/*.jar",
    ],
    "javascript-typescript": [
      "**/*.js",
      "**/*.ts",
      "**/*.jsx",
      "**/*.tsx",
      "**/package.json",
      "**/yarn.lock",
      "**/package-lock.json",
    ],
    javascript: [
      "**/*.js",
      "**/package.json",
      "**/yarn.lock",
      "**/package-lock.json",
    ],
    ruby: ["**/*.rb", "**/Gemfile", "**/Gemfile.lock"],
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
    ],
  };

  for (const [language, globs] of Object.entries(extra_globs)) {
    filters[language] ??= [];
    filters[language].push(...globs);
  }

  for (const [language, lang_data] of Object.entries(projects)) {
    const lang_globs = globs[language] ?? ["**/*"];

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
