const fs = require('fs');

const {extractTestsFromSuite} = require('./test');

/**
 * Reads and processes test results from a JSON file
 * @param {string} filePath - Path to the test results JSON file
 * @returns {object} Processed test results
 */
function readTestResults(filePath) {
    if (!fs.existsSync(filePath)) {
        console.info(`Test results file not found: ${filePath}`);
        return {total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, tests: []};
    }

    const data = JSON.parse(fs.readFileSync(filePath));
    const allTests = data.suites.flatMap((suite) => extractTestsFromSuite(suite));

    return {
        total: data.stats.expected + data.stats.unexpected + data.stats.flaky + data.stats.skipped,
        passed: data.stats.expected,
        failed: data.stats.unexpected,
        flaky: data.stats.flaky,
        skipped: data.stats.skipped,
        tests: allTests,
    };
}

/**
 * Gets the test status information
 * @param {object} results - Test results object
 * @returns {object} Status information including color and label
 */
function getTestStatus(results) {
    const status = results.failed > 0 ? '❌ FAILED' : results.flaky > 0 ? '⚠️ FLAKY' : '✅ PASSED';

    const statusColor = results.failed > 0 ? 'red' : results.flaky > 0 ? 'orange' : 'green';

    return {status, statusColor};
}

module.exports = {
    readTestResults,
    getTestStatus,
};
