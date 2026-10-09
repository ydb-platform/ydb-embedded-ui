import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import type {TSystemStateInfo} from '../../../src/types/api/nodes';
import {EMPTY_DATA_PLACEHOLDER} from '../../../src/utils/emptyDataPlaceholder';

import {NodePage} from './NodePage';

async function mockNodeMemory(
    page: Page,
    memory: Pick<TSystemStateInfo, 'MemoryUsed' | 'MemoryLimit' | 'MemoryStats'>,
) {
    await page.route(/\/viewer\//, async (route) => {
        const url = new URL(route.request().url());
        let json: unknown = {};
        if (url.pathname.endsWith('/sysinfo') && url.searchParams.get('node_id') === '.') {
            json = {SystemStateInfo: [{NodeId: 1, Host: 'bootstrap-node', SystemState: 'Green'}]};
        } else if (url.pathname.endsWith('/sysinfo')) {
            expect(url.searchParams.get('node_id')).toBe('42');
            json = {
                SystemStateInfo: [
                    {
                        NodeId: 42,
                        Host: 'ram-test-node',
                        SystemState: 'Green',
                        Version: 'test',
                        Endpoints: [{Name: 'gRPC', Address: 'ram-test-node:2135'}],
                        NumberOfCpus: 8,
                        LoadAverage: [2, 1, 0.5],
                        PoolStats: [{Name: 'System', Usage: 0.25, Threads: 8}],
                        ...memory,
                    },
                ],
            };
        } else if (url.pathname.endsWith('/whoami')) {
            json = {UserSID: 'ram-test', IsViewerAllowed: true, IsMonitoringAllowed: true};
        } else if (url.pathname.endsWith('/nodelist')) {
            json = [{NodeId: 42, Host: 'ram-test-node'}];
        }
        await route.fulfill({json});
    });
}

test.describe('Node RAM', () => {
    test('uses the effective YDB limit on the node page', async ({page}) => {
        await mockNodeMemory(page, {
            MemoryUsed: '20000000000',
            MemoryLimit: '32000000000',
            MemoryStats: {AnonRss: '20000000000', HardLimit: '24000000000'},
        });
        const nodePage = new NodePage(page, '42');
        await nodePage.goto();
        await nodePage.waitForNodePageLoad();
        await expect(nodePage.ram).toHaveText(/RAM20\s*GB\s*\/\s*24\s*GB/);
        await expect(nodePage.ram.locator('.progress-viewer__line')).toHaveAttribute(
            'style',
            'width: 83%;',
        );
    });

    for (const theme of ['light', 'dark']) {
        test(`shows memory usage below Load average in ${theme} theme`, async ({
            page,
        }, testInfo) => {
            await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
            await mockNodeMemory(page, {MemoryUsed: '60000000000', MemoryLimit: '100000000000'});
            const nodePage = new NodePage(page, '42');
            await nodePage.goto();
            await nodePage.waitForNodePageLoad();

            await expect(page.getByText('FQDN: ram-test-node', {exact: true})).toBeVisible();
            await expect(page.getByRole('term').filter({hasText: /^Version$/})).toBeVisible();
            await expect(page.getByRole('definition').filter({hasText: /^test$/})).toBeVisible();
            await expect(page.getByRole('term').filter({hasText: /^gRPC$/})).toBeVisible();
            await expect(
                page.getByRole('definition').filter({hasText: /^ram-test-node:2135$/}),
            ).toBeVisible();
            await expect(page.getByRole('term').filter({hasText: /^1 min$/})).toBeVisible();
            await expect(
                page.getByRole('definition').getByText('25%', {exact: true}),
            ).toBeVisible();
            await expect(nodePage.ram).toHaveText(/RAM60\s*GB\s*\/\s*100\s*GB/);
            const progress = nodePage.ram.locator('.progress-viewer');
            await expect(progress).toHaveClass(/progress-viewer_status_good/);
            await expect(progress).toHaveClass(new RegExp(`progress-viewer_theme_${theme}`));
            await expect(progress.locator('.progress-viewer__line')).toHaveAttribute(
                'style',
                'width: 60%;',
            );

            for (const width of [1440, 768]) {
                await page.setViewportSize({width, height: 900});
                const loadAverage = page.locator('.full-node-viewer__section_average');
                const loadBox = await loadAverage.boundingBox();
                const ramBox = await nodePage.ram.boundingBox();
                if (!loadBox || !ramBox) {
                    throw new Error('Load average and RAM sections must be visible');
                }
                expect(ramBox.y).toBeGreaterThanOrEqual(loadBox.y + loadBox.height);
                expect(ramBox.x).toBe(loadBox.x);
                await page.screenshot({
                    path: testInfo.outputPath(`node-ram-${theme}-${width}.png`),
                });
            }
        });
    }

    const cases = [
        {
            name: 'zero usage',
            used: '0',
            limit: '100000000000',
            text: /0\s*GB\s*\/\s*100\s*GB/,
            bar: true,
        },
        {
            name: 'missing usage',
            used: undefined,
            limit: '100000000000',
            text: EMPTY_DATA_PLACEHOLDER,
            bar: false,
        },
        {
            name: 'invalid usage',
            used: 'invalid',
            limit: '100000000000',
            text: EMPTY_DATA_PLACEHOLDER,
            bar: false,
        },
        {
            name: 'empty usage',
            used: '',
            limit: '100000000000',
            text: EMPTY_DATA_PLACEHOLDER,
            bar: false,
        },
        {
            name: 'missing limit',
            used: '60000000000',
            limit: undefined,
            text: /60\s*GB$/,
            bar: false,
        },
        {name: 'zero limit', used: '60000000000', limit: '0', text: /60\s*GB$/, bar: false},
        {
            name: 'invalid limit',
            used: '60000000000',
            limit: 'invalid',
            text: /60\s*GB$/,
            bar: false,
        },
    ];

    for (const {name, used, limit, text, bar} of cases) {
        test(`handles ${name}`, async ({page}) => {
            await mockNodeMemory(page, {MemoryUsed: used, MemoryLimit: limit});
            const nodePage = new NodePage(page, '42');
            await nodePage.goto();
            await expect(nodePage.ram).toContainText(text);
            await expect(nodePage.ram.locator('.progress-viewer')).toHaveCount(bar ? 1 : 0);
        });
    }
});
