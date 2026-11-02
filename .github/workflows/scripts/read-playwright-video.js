function readPlaywrightVideo(workflow) {
    const match = workflow.match(
        /^[ \t]*PLAYWRIGHT_VIDEO:[ \t]*(?:(['"])([a-z-]+)\1|([a-z-]+))(?:[ \t]+#.*)?[ \t]*\r?$/m,
    );
    return match?.[2] ?? match?.[3];
}

module.exports = {readPlaywrightVideo};
