const yaml = require("yaml");

function run(github, context, core) {
  const build_mode_none_languages = new Set(["csharp", "java", "python", "javascript-typescript", "ruby"]);
  const auto_build_languages = new Set(["go", "java-kotlin", "cpp", "swift"]);
  const allowed_build_modes = new Set(["auto", "none", "manual", "other"]);
  const other_err = 'setting as "other", which requires a fully manual scan with no automatic CodeQL analysis';

  const raw_filters = process.env.filters;

  let projects_to_scan = {};

  const raw_projects = process.env.projects;

  if (!raw_projects) {
    core.setFailed("projects is required");
    return;
  }

  const raw_queries = process.env.queries;

  const projects = JSON.parse(raw_projects);
  const filters = (raw_filters !== undefined && raw_filters !== "") ? JSON.parse(raw_filters) : undefined;
  const changes = filters !== undefined ? JSON.parse(filters.changes) : [];
  const queries = raw_queries !== "" ? raw_queries.split(",") : ["code-scanning"];

  core.debug("Changes:");
  core.debug(JSON.stringify(changes));
  core.debug("Projects:");
  core.debug(JSON.stringify(projects));

  core.debug(Object.entries(projects));

  // Filter out projects that don't have changes
  for (const [language, lang_data] of Object.entries(projects)) {
    core.debug("Language: " + language);
    core.debug("Projects: " + JSON.stringify(lang_data.projects));

    projects_to_scan[language] = {};

    projects_to_scan[language]["projects"] = Object.fromEntries(
      Object.entries(lang_data.projects).filter((project) => {
        const [name, project_data] = project;
        core.debug("Project: " + name);
        core.debug("Paths: " + JSON.stringify(project_data.paths));
        return changes.includes(name) || filters === undefined;
      })
    );

    if (lang_data["build-mode"] !== undefined) {
      projects_to_scan[language]["build-mode"] = lang_data["build-mode"];
    }
  }

  core.debug("Projects to scan:");
  core.debug(JSON.stringify(projects_to_scan));

  const filtered_languages = new Set();
  const filtered_projects = [];

  for (const [language, lang_data] of Object.entries(projects_to_scan)) {
    core.debug("Language: " + language);
    core.debug("Filtered projects: " + JSON.stringify(lang_data.projects));

    filtered_languages.add(language);

    const lang_build_mode = lang_data["build-mode"];
    const lang_queries = lang_data.queries;

    for (const [name, project_data] of Object.entries(lang_data.projects)) {
      const paths = new Set(project_data.paths);
      let build_mode = project_data["build-mode"] ?? lang_build_mode;
      const project_queries = new Set(project_data.queries ?? lang_queries ?? queries);

      if (build_mode === undefined) {
        // auto-set build-mode depending on the language
        if (build_mode_none_languages.has(language)) {
          build_mode = "none";
        } else if (auto_build_languages.has(language)) {
          build_mode = "auto";
        } else {
          core.warning(`No build-mode set for project: ${language}/${name}, ${other_err}`);
          build_mode = "other";
        }
      } else {
        if (!allowed_build_modes.has(build_mode)) {
          core.error(`Invalid build-mode set for project: ${language}/${name}, ${other_err}`);
          build_mode = "other";
        }
      }

      const codeql_config = yaml.stringify({
        paths: Array.from(project_paths),
        queries: Array.from(project_queries).map((query) => {uses: query}),
      });

      const project = {
        name: name,
        paths: Array.from(paths),
        sparse_checkout: Array.from(paths).join("\n"),
        codeql_config: codeql_config,
        language: language,
        build_mode: build_mode,
      };

      filtered_projects.push(project);
    }
  }

  core.debug("Projects list:");
  core.debug(JSON.stringify(filtered_projects));

  const result = {
    projects: Array.from(filtered_projects),
    length: filtered_projects.length,
    languages: Array.from(filtered_languages),
  };

  core.debug("Result:");
  core.debug(JSON.stringify(result));

  core.debug("Scan required:");
  core.debug(result.length > 0);

  core.setOutput("scan-required", result.length > 0);

  return result;
}

module.exports = (github, context, core) => {
  return run(github, context, core);
};
