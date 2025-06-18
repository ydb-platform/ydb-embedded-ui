const {formatSize} = require('./format');

/**
 * Generates the bundle size status section
 * @param {object} bundleInfo - Bundle size information
 * @param bundleInfo.currentSize
 * @param bundleInfo.mainSize
 * @param bundleInfo.diff
 * @param bundleInfo.percent
 * @returns {string} Formatted bundle size section
 */
function generateBundleSizeSection({currentSize, mainSize, diff, percent}) {
    const bundleStatus =
        percent === 'N/A'
            ? '⚠️'
            : parseFloat(percent) > 0
              ? '🔺'
              : parseFloat(percent) < 0
                ? '🔽'
                : '✅';

    const sizeChangeMessage =
        percent === 'N/A'
            ? '⚠️ Unable to calculate change.'
            : parseFloat(percent) > 0
              ? '⚠️ Bundle size increased. Please review.'
              : parseFloat(percent) < 0
                ? '✅ Bundle size decreased.'
                : '✅ Bundle size unchanged.';

    return `### Bundle Size: ${bundleStatus}
  Current: ${formatSize(currentSize)} | Main: ${formatSize(mainSize)}
  Diff: ${diff > 0 ? '+' : ''}${formatSize(Math.abs(diff))} (${percent === 'N/A' ? 'N/A' : `${percent}%`})

  ${sizeChangeMessage}`;
}

/**
 * Gets bundle size information from environment variables
 * @returns {object} Bundle size information
 */
function getBundleInfo() {
    return {
        currentSize: parseInt(process.env.CURRENT_SIZE || '0'),
        mainSize: parseInt(process.env.MAIN_SIZE || '0'),
        diff: parseInt(process.env.SIZE_DIFF || '0'),
        percent: process.env.SIZE_PERCENT || 'N/A',
    };
}

module.exports = {
    generateBundleSizeSection,
    getBundleInfo,
};
