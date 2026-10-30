import {copyFile, mkdir, mkdtemp, rm} from 'node:fs/promises';
import path from 'node:path';

import {test as base} from '@playwright/test';
import {createRsbuild, loadConfig} from '@rsbuild/core';

export const test = base.extend<{}, {multiClusterUrl: string}>({
    multiClusterUrl: [
        // Playwright requires destructuring even when the fixture has no dependencies.
        // eslint-disable-next-line no-empty-pattern
        async ({}, use, workerInfo) => {
            const root = workerInfo.config.webServer?.cwd ?? path.resolve(__dirname, '../..');
            const artifacts = path.join(root, 'playwright-artifacts');
            await mkdir(artifacts, {recursive: true});
            const fixtureDir = await mkdtemp(path.join(artifacts, 'multi-cluster-'));
            try {
                // Keep the entry's relative src imports and dependencies in the target UI checkout,
                // which can differ from the test checkout in release E2E runs.
                const entry = path.join(fixtureDir, 'multiClusterApp.tsx');
                await copyFile(path.join(__dirname, 'multiClusterApp.tsx'), entry);
                const {content: config} = await loadConfig({cwd: root});
                const rsbuild = await createRsbuild({
                    cwd: root,
                    rsbuildConfig: {
                        ...config,
                        mode: 'development',
                        source: {...config.source, entry: {index: entry}},
                        html: {...config.html, template: path.join(__dirname, 'multiCluster.html')},
                        server: {
                            host: '127.0.0.1',
                            port: 3210 + workerInfo.parallelIndex,
                            printUrls: false,
                        },
                        dev: {lazyCompilation: false, hmr: false, liveReload: false},
                        output: {...config.output, injectStyles: true},
                    },
                });
                const {port, server} = await rsbuild.startDevServer();
                try {
                    await use(`http://127.0.0.1:${port}`);
                } finally {
                    await server.close();
                }
            } finally {
                await rm(fixtureDir, {recursive: true, force: true});
            }
        },
        {scope: 'worker', timeout: 120000},
    ],
});
