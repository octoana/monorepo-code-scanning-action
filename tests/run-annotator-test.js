const { run } = require('../sarif-project-annotator/sarif-project-annotator')
const core = require('@actions/core')
const fs = require('fs').promises

// Generate a SARIF
//>cd samples
//>codeql database create --language csharp --build-mode none .codeql\db-csharp --overwrite
//>codeql database analyze .\.codeql\db-csharp --format=sarifv2.1.0 --output=../tests/sarif/sample.sarif
//>codeql database analyze .\.codeql\db-csharp --format=sarif-latest --sarif-add-baseline-file-info --sarif-group-rules-by-pack --sarif-include-query-help=always --sublanguage-file-coverage --sarif-include-diagnostics  --output=../tests/sarif/sample.sarif
async function testSarifProjectAnnotator() {
    try {
        // Mock the inputs
        core.getInput = (name) => {
            switch (name) {
                case 'project':
                    return 'Project2'
                case 'projects-json':
                    return 'samples/projects.json'
                case 'sarif_file':
                    return 'tests/sarif/sample.sarif'
                case 'output_file':
                    return 'tests/sarif/output.sarif'
                default:
                    throw new Error(`Unknown input: ${name}`)
            }
        }

        // Run the annotator
        await run()

        // Verify the output
        const outputContent = await fs.readFile('tests/sarif/output.sarif', 'utf8')
        const outputData = JSON.parse(outputContent)

        // Check if the outputData.runs[].tool.extensions[].rules[].properties.tags[] contains the project name
        const projectTag = `project/${core.getInput('project')}`
        const hasProjectTag = outputData.runs.some(run =>
            run.tool.extensions.some(extension =>
                extension.rules && extension.rules.some(rule =>
                    rule.properties && rule.properties.tags && rule.properties.tags.includes(projectTag)
                )
            )
        )

        // Add your assertions here
        if (!hasProjectTag) {
            throw new Error(`❌ - Expected project tag "${projectTag}" not found in output SARIF file.`)
        }
        else {
            console.log(`✅ - Project tag "${projectTag}" found in output SARIF file.`)
        }
    } catch (error) {
        console.error(`🚨 - Test failed with error: ${error}`)
    }
}

testSarifProjectAnnotator()