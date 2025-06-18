/**
 * Checks if a test spec is marked as skipped
 * @param {object} spec - Test specification object
 * @returns {boolean} True if the test is skipped
 */
function isTestSkipped(spec) {
    return (
        spec.tests?.[0] &&
        (spec.tests[0].annotations?.some((a) => a.type === 'skip') ||
            spec.tests[0].status === 'skipped')
    );
}

/**
 * Extracts test information from a test suite recursively
 * @param {object} suite - Test suite object
 * @param {string} parentTitle - Parent suite title for nested suites
 * @returns {Array} Array of test objects with metadata
 */
function extractTestsFromSuite(suite, parentTitle = '') {
    const tests = [];
    const fullSuiteTitle = parentTitle ? `${parentTitle} > ${suite.title}` : suite.title;

    // Process individual test specs
    if (suite.specs) {
        const suiteTests = suite.specs.map((spec) => {
            const isSkipped = isTestSkipped(spec);
            return {
                title: spec.title,
                fullTitle: `${fullSuiteTitle} > ${spec.title}`,
                status: isSkipped ? 'skipped' : spec.ok ? 'passed' : 'failed',
                file: suite.file,
                skipped: isSkipped,
            };
        });
        tests.push(...suiteTests);
    }

    // Recursively process nested suites
    if (suite.suites) {
        suite.suites.forEach((nestedSuite) => {
            const nestedTests = extractTestsFromSuite(nestedSuite, fullSuiteTitle);
            tests.push(...nestedTests);
        });
    }

    return tests;
}

/**
 * Compares current and main branch test results
 * @param {Array} currentTests - Tests from current branch
 * @param {Array} mainTests - Tests from main branch
 * @returns {object} Test comparison results
 */
function compareTests(currentTests, mainTests) {
    const comparison = {new: [], skipped: [], deleted: []};

    const currentTestMap = new Map(currentTests.map((t) => [t.fullTitle, t]));
    const mainTestMap = new Map(mainTests.map((t) => [t.fullTitle, t]));

    // Find new and skipped tests
    for (const [fullTitle, test] of currentTestMap) {
        if (!mainTestMap.has(fullTitle)) {
            comparison.new.push(`${test.title} (${test.file})`);
        }
        if (test.skipped) {
            comparison.skipped.push(`${test.title} (${test.file})`);
        }
    }

    // Find deleted tests
    for (const [fullTitle, test] of mainTestMap) {
        if (!currentTestMap.has(fullTitle)) {
            comparison.deleted.push(`${test.title} (${test.file})`);
        }
    }

    comparison.skipped = Array.from(new Set(comparison.skipped));
    return comparison;
}

module.exports = {
    isTestSkipped,
    extractTestsFromSuite,
    compareTests,
};
