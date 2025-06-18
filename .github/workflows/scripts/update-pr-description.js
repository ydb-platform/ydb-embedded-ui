const {generateBundleSizeSection, getBundleInfo} = require('./utils/bundle');
const {generateTestChangesSummary} = require('./utils/format');
const {readTestResults, getTestStatus} = require('./utils/results');
const {compareTests} = require('./utils/test');

/**
 * Main function to update PR description with test results and bundle size information
 * @param {object} github - GitHub API object
 * @param {object} context - GitHub Actions context
 */
async function updatePRDescription(github, context) {
    // Read test results
    const currentResults = readTestResults('playwright-artifacts/test-results.json');
    const mainResults = readTestResults('gh-pages/main/test-results.json');

    // Compare tests
    const testComparison = compareTests(currentResults.tests, mainResults.tests);

    // Get test status and report URL
    const {status, statusColor} = getTestStatus(currentResults);
    const reportUrl = `https://${context.repo.owner}.github.io/${context.repo.repo}/${context.issue.number}/`;

    // Get bundle size information
    const bundleInfo = getBundleInfo();

    // Generate the CI section content
    const ciSection = `## CI Results

  ### Test Status: <span style="color: ${statusColor};">${status}</span>
  📊 [Full Report](${reportUrl})

  | Total | Passed | Failed | Flaky | Skipped |
  |:-----:|:------:|:------:|:-----:|:-------:|
  | ${currentResults.total} | ${currentResults.passed} | ${currentResults.failed} | ${currentResults.flaky} | ${currentResults.skipped} |

  ${generateTestChangesSummary(testComparison)}

  ${generateBundleSizeSection(bundleInfo)}

  <details>
  <summary>ℹ️ CI Information</summary>

  - Test recordings for failed tests are available in the full report.
  - Bundle size is measured for the entire 'dist' directory.
  - 📊 indicates links to detailed reports.
  - 🔺 indicates increase, 🔽 decrease, and ✅ no change in bundle size.
  </details>`;

    // Update PR description
    const {data: pullRequest} = await github.rest.pulls.get({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: context.issue.number,
    });

    const currentBody = pullRequest.body || '';
    const ciSectionRegex = /## CI Results[\s\S]*?(?=\n## (?!CI Results)|$)/;

    const newBody = ciSectionRegex.test(currentBody)
        ? currentBody.replace(ciSectionRegex, ciSection)
        : currentBody + '\n\n' + ciSection;

    await github.rest.pulls.update({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: context.issue.number,
        body: newBody,
    });
}

module.exports = updatePRDescription;
