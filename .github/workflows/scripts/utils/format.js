/**
 * Formats a size in bytes to a human-readable string (KB or MB)
 * @param {number} sizeInBytes - Size in bytes to format
 * @returns {string} Formatted size string with units
 */
function formatSize(sizeInBytes) {
    const MB_THRESHOLD = 10 * 1024;
    if (sizeInBytes >= MB_THRESHOLD) {
        return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(sizeInBytes / 1024).toFixed(2)} KB`;
}

/**
 * Generates a summary of test changes
 * @param {object} comparison - Test comparison results
 * @returns {string} Formatted test changes summary
 */
function generateTestChangesSummary(comparison) {
    if (!comparison.new.length && !comparison.deleted.length && !comparison.skipped.length) {
        return '😟 No changes in tests. 😕';
    }

    const summaryParts = [];
    const {new: newTests, skipped, deleted} = comparison;

    if (newTests.length) {
        summaryParts.push(
            `#### ✨ New Tests (${newTests.length})\n${newTests.map((test, i) => `${i + 1}. ${test}`).join('\n')}\n`,
        );
    }

    if (skipped.length) {
        summaryParts.push(
            `#### ⏭️ Skipped Tests (${skipped.length})\n${skipped.map((test, i) => `${i + 1}. ${test}`).join('\n')}\n`,
        );
    }

    if (deleted.length) {
        summaryParts.push(
            `#### 🗑️ Deleted Tests (${deleted.length})\n${deleted.map((test, i) => `${i + 1}. ${test}`).join('\n')}`,
        );
    }

    return `
  <details>
  <summary>Test Changes Summary ${newTests.length ? `✨${newTests.length} ` : ''}${skipped.length ? `⏭️${skipped.length} ` : ''}${deleted.length ? `🗑️${deleted.length}` : ''}</summary>

  ${summaryParts.join('\n')}
  </details>`;
}

module.exports = {
    formatSize,
    generateTestChangesSummary,
};
