const fs = require('node:fs');
const {chromium, webkit, devices} = require('/work/node_modules/@playwright/test');
(async () => {
    const result = {
        started: new Date().toISOString(),
        arch: process.arch,
        node: process.version,
        playwright: require('/work/node_modules/@playwright/test/package.json').version,
        browsers: {},
    };
    const response = await fetch('http://localhost:8765/viewer/json/tenants');
    const tenants = await response.json();
    if (!response.ok || !JSON.stringify(tenants).includes('/local'))
        throw new Error('Root /local unavailable');
    result.backend = {status: response.status, tenants};
    for (const [name, engine, device] of [
        ['chromium', chromium, devices['Desktop Chrome']],
        ['webkit', webkit, devices['Desktop Safari']],
    ]) {
        const browser = await engine.launch({timeout: 30000});
        try {
            const context = await browser.newContext(device);
            const page = await context.newPage();
            const start = Date.now();
            const assets = [];
            page.on('response', (r) => {
                if (/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(r.url()))
                    assets.push({url: r.url(), status: r.status()});
            });
            await page.goto('http://localhost:8765/');
            result.browsers[name] = {
                passed: false,
                version: browser.version(),
                identity: await page.evaluate(() => ({
                    platform: navigator.platform,
                    userAgent: navigator.userAgent,
                })),
                backendTitle: await page.title(),
            };
            await page.setContent(
                '<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rubik&display=swap"></head><body><div style="font-family:Rubik;font-size:16px">Font preflight</div></body></html>',
                {waitUntil: 'load', timeout: 30000},
            );
            const font = await page.evaluate(async () => {
                const loaded = await document.fonts.load('16px Rubik');
                return {
                    count: loaded.length,
                    ready: document.fonts.check('16px Rubik'),
                    faces: loaded.map((f) => ({family: f.family, status: f.status})),
                };
            });
            result.browsers[name].googleFonts = {assets, font, ms: Date.now() - start};
            fs.writeFileSync(
                '/work/playwright-artifacts/browser-preflight.json',
                JSON.stringify(result, null, 2),
            );
            if (
                !font.ready ||
                !font.count ||
                !assets.some((a) => a.url.includes('fonts.googleapis.com/') && a.status === 200) ||
                !assets.some((a) => a.url.includes('fonts.gstatic.com/') && a.status === 200)
            )
                throw new Error('Original Rubik CSS/font unavailable in ' + name);
            result.browsers[name].passed = true;
        } finally {
            await browser.close();
        }
    }
    result.finished = new Date().toISOString();
    fs.writeFileSync(
        '/work/playwright-artifacts/browser-preflight.json',
        JSON.stringify(result, null, 2),
    );
    console.log('BROWSER_PREFLIGHT ' + JSON.stringify(result));
})().catch((error) => {
    console.error(error);
    process.exitCode = 20;
});
