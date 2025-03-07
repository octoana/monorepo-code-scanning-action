const { run } = require('../sarif-project-annotator/sarif-project-annotator')
const core = require('@actions/core')
const fs = require('fs').promises

async function testSarifProjectAnnotator() {
  try {
    // Mock the inputs
    core.getInput = (name) => {
      switch (name) {
        case 'projects-json':
          return 'samples/projects.json'
        case 'sarif_file':
          return 'samples/sample.sarif'
        case 'output_file':
          return 'samples/output.sarif'
        default:
          throw new Error(`Unknown input: ${name}`)
      }
    }

    // Run the annotator
    await run(null,null,core)

    // Verify the output
    const outputContent = await fs.readFile('samples/output.sarif', 'utf8')
    const outputData = JSON.parse(outputContent)

    // Add your assertions here
    console.log(outputData)
  } catch (error) {
    console.error(`Test failed with error: ${error}`)
  }
}

testSarifProjectAnnotator()