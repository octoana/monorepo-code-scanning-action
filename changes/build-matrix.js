function run(github, context, core) {
  const raw_filters = process.env.filters;

  let projects_to_scan = {};

  const raw_projects = process.env.projects;

  if (!raw_projects) {
    core.setFailed("projects is required");
    return;
  }

  const projects = JSON.parse(raw_projects);
  const filters = (raw_filters !== undefined && raw_filters !== "") ? JSON.parse(raw_filters) : undefined;
  const changes = filters !== undefined ? JSON.parse(filters.changes) : [];

  core.debug("Changes:");
  core.debug(JSON.stringify(changes));
  core.debug("Projects:");
  core.debug(JSON.stringify(projects));

  core.debug(Object.entries(projects));

  // Filter out projects that don't have changes
  for (const [language, lang_projects] of Object.entries(projects)) {
    core.debug("Language: " + language);
    core.debug("Projects: " + JSON.stringify(lang_projects));

    projects_to_scan[language] = Object.fromEntries(
      Object.entries(lang_projects).filter((project) => {
        const [name, paths] = project;
        core.debug("Project: " + name);
        core.debug("Paths: " + JSON.stringify(paths));
        return changes.includes(name) || filters === undefined;
      })
    );
  }

  core.debug("Projects to scan:");
  core.debug(JSON.stringify(projects_to_scan));

  const filtered_languages = new Set();
  const filtered_projects = [];

  for (const [language, lang_projects] of Object.entries(projects_to_scan)) {
    core.debug("Language: " + language);
    core.debug("Projects: " + JSON.stringify(lang_projects));

    filtered_languages.add(language);

    for (const [name, paths] of Object.entries(lang_projects)) {
      const project = {
        name: name,
        paths: Array.from(paths),
        sparse_checkout: Array.from(paths).join("\n"),
        codeql_config: "paths:\n  - " + Array.from(paths).join("\n  - "),
        language: language,
        build_mode: 'none', // TODO: make this configurable
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
