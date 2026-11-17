import {expect, test} from '@playwright/test';
import type {Locator, Page, Route} from '@playwright/test';

import {backend, database} from '../../../utils/constants';
import {QueryEditorMode, TenantPage} from '../TenantPage';

async function mockEditorBackend(route: Route) {
    const pathname = new URL(route.request().url()).pathname;
    let json: unknown = {};
    if (pathname.endsWith('/whoami')) {
        json = {UserSID: 'resize-test-user', IsDatabaseAllowed: true, IsViewerAllowed: true};
    } else if (pathname.endsWith('/tenantinfo')) {
        json = {TenantInfo: [{Name: database, Type: 'Dedicated', State: 'RUNNING'}]};
    } else if (pathname.endsWith('/describe')) {
        json = {Path: database, PathDescription: {Self: {PathType: 'SubDomain'}}};
    } else if (pathname.endsWith('/nodelist')) {
        json = [];
    } else if (pathname.endsWith('/query')) {
        json = {
            plan: {
                meta: {version: '0.2', type: 'query'},
                Plan: {'Node Type': 'Query', Plans: [{'Node Type': 'ResultSet', PlanNodeId: 1}]},
            },
        };
    }
    await route.fulfill({json});
}

async function getBounds(locator: Locator) {
    const bounds = await locator.boundingBox();
    if (!bounds) {
        throw new Error('Expected a visible editor layout element');
    }
    return bounds;
}

async function dragDivider(page: Page, divider: Locator, targetY: number) {
    const bounds = await getBounds(divider);
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width / 2, targetY, {steps: 8});
    await page.mouse.up();
}

async function expectAccessibleDivider(page: Page) {
    const divider = page.locator('.query-editor > .kv-split > .gutter');
    const controls = page.locator('.ydb-query-editor-controls');
    await expect(async () => {
        const bounds = await getBounds(divider);
        const controlsBounds = await getBounds(controls);
        expect(controlsBounds.y + controlsBounds.height).toBeLessThanOrEqual(bounds.y + 1);
        expect(bounds.height).toBeGreaterThanOrEqual(8);
        expect(
            await divider.evaluate((element) => {
                const rect = element.getBoundingClientRect();
                return element.contains(
                    document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2),
                );
            }),
        ).toBe(true);
    }).toPass({timeout: 5000});
}

for (const mode of [QueryEditorMode.SingleTab, QueryEditorMode.MultiTab]) {
    test(`editor controls and divider remain accessible after resizing: ${mode}`, async ({
        page,
    }, testInfo) => {
        await page.route(`${backend}/**`, mockEditorBackend);
        await page.addInitScript(
            (theme) => {
                localStorage.setItem('theme', theme);
                if (!localStorage.getItem('default-size-result-pane')) {
                    localStorage.setItem('default-size-result-pane', '0,100');
                }
            },
            mode === QueryEditorMode.MultiTab ? 'dark' : 'light',
        );
        const tenant = new TenantPage(page);
        await tenant.gotoQueryEditor({schema: database, database, mode});
        await expectAccessibleDivider(page);
        await tenant.queryEditor.explain('SELECT 1;', 'query');
        await expect(tenant.queryEditor.waitForStatus('Completed')).resolves.toBe(true);
        await page.getByRole('radio', {name: 'Computation Graph', exact: true}).check();

        const editorPane = page.locator('.query-editor__pane-wrapper_top');
        const divider = page.locator('.query-editor > .kv-split > .gutter');
        const initial = await getBounds(editorPane);
        await dragDivider(page, divider, initial.y);
        await expectAccessibleDivider(page);
        await page.getByRole('button', {name: 'Run', exact: true}).click({trial: true});
        await page.screenshot({path: testInfo.outputPath('editor-min-height.png')});

        const collapsed = await getBounds(editorPane);
        await dragDivider(page, divider, collapsed.y + collapsed.height + 120);
        await expect
            .poll(async () => (await getBounds(editorPane)).height)
            .toBeGreaterThan(collapsed.height + 80);
        await expectAccessibleDivider(page);

        const split = await getBounds(page.locator('.query-editor > .kv-split'));
        await dragDivider(page, divider, split.y + split.height);
        await expectAccessibleDivider(page);
        await dragDivider(page, divider, initial.y);
        await page.setViewportSize({width: 1000, height: 650});
        await expectAccessibleDivider(page);
        await page.reload();
        await tenant.queryEditor.waitForEditorReady();
        await expectAccessibleDivider(page);
    });
}
