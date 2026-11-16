import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import type {QuerySettings} from '../../src/types/store/query';
import {DEFAULT_QUERY_SETTINGS, TRANSACTION_MODES} from '../../src/utils/query';
import {QueryEditor} from '../suites/tenant/queryEditor/models/QueryEditor';

async function mockBackend(
    page: Page,
    initial: QuerySettings = DEFAULT_QUERY_SETTINGS,
    queryVersion = 11,
    streaming = false,
) {
    const settings: Record<string, string> = {
        queryExecutionSettings: JSON.stringify(initial),
        enableQueryStreaming: JSON.stringify(streaming),
    };
    const writes: string[] = [];
    const queries: Record<string, unknown>[] = [];
    const tracingHeaders: (string | undefined)[] = [];
    await page.addInitScript(
        ({initial: savedSettings, streaming: streamEnabled}) => {
            if (!localStorage.getItem('queryExecutionSettings')) {
                localStorage.setItem('queryExecutionSettings', JSON.stringify(savedSettings));
            }
            localStorage.setItem('enableQueryStreaming', JSON.stringify(streamEnabled));
            if (!localStorage.getItem('theme')) {
                localStorage.setItem('theme', 'dark');
            }
        },
        {initial, streaming},
    );
    await page.route('**/*', async (route) => {
        const request = route.request();
        const {pathname, searchParams} = new URL(request.url());
        if (!/\/(?:viewer|meta|scheme|capabilities)(?:\/|$)/.test(pathname)) {
            await route.continue();
            return;
        }
        let body: unknown = {};
        if (pathname.endsWith('/capabilities')) {
            body = {Capabilities: {'/viewer/query': queryVersion}};
        } else if (pathname.endsWith('/whoami')) {
            body = {UserSID: 'test', IsViewerAllowed: true, IsMonitoringAllowed: true};
        } else if (pathname.endsWith('/tenantinfo')) {
            body = {
                TenantInfo: [
                    {
                        Name: '/local',
                        Type: 'Dedicated',
                        State: 'RUNNING',
                        Overall: 'Green',
                        NodeIds: [1],
                    },
                ],
            };
        } else if (pathname.includes('/describe')) {
            body = {
                Status: 'SUCCESS',
                Path: '/local',
                PathDescription: {
                    Self: {PathType: 'SubDomain', Name: 'local', PathId: '1', SchemeshardId: '1'},
                    Children: [],
                },
            };
        } else if (pathname.endsWith('/cluster')) {
            body = {Name: 'test', NodesTotal: 1, NodesAlive: 1, Overall: 'Green'};
        } else if (pathname.endsWith('/sysinfo')) {
            body = {SystemStateInfo: [{NodeId: 1, Host: 'localhost', SystemState: 'Green'}]};
        } else if (pathname.endsWith('/query')) {
            const data = request.postDataJSON() ?? {};
            if (String(data.query).includes('.sys/resource_pools')) {
                body = {
                    version: 8,
                    result: [
                        {columns: [{name: 'Name', type: 'Utf8?'}], rows: [['default'], ['olap']]},
                    ],
                };
            } else {
                queries.push(data);
                tracingHeaders.push(request.headers()['x-trace-verbosity']);
                if (searchParams.get('schema') === 'multipart') {
                    const parts = [
                        {
                            version: 10,
                            meta: {
                                node_id: 1,
                                event: 'SessionCreated',
                                query_id: 'mock-query',
                                session_id: 'mock-session',
                            },
                        },
                        {
                            result: {columns: [{name: 'value', type: 'Int32'}], rows: [[1]]},
                            meta: {seq_no: 1, result_index: 0, event: 'StreamData'},
                        },
                        {status: 'SUCCESS', meta: {event: 'QueryResponse'}},
                    ]
                        .map((part) => {
                            const json = JSON.stringify(part);
                            return `--boundary\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}\r\n`;
                        })
                        .join('');
                    await route.fulfill({
                        status: 200,
                        contentType: 'multipart/x-mixed-replace; boundary=boundary',
                        body: parts + '--boundary--\r\n',
                    });
                    return;
                }

                body = {
                    version: 8,
                    result: [{columns: [{name: 'value', type: 'Int32'}], rows: [[1]]}],
                };
            }
        } else if (pathname.endsWith('/get_user_settings')) {
            const names: string[] = request.postDataJSON().name;
            body = Object.fromEntries(
                names.filter((name) => name in settings).map((name) => [name, settings[name]]),
            );
        } else if (pathname.endsWith('/user_settings')) {
            const name = searchParams.get('name') || '';
            if (request.method() === 'POST') {
                settings[name] = request.postDataJSON();
                writes.push(name);
                body = {status: 'SUCCESS'};
            } else {
                body = settings[name];
            }
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(body ?? null),
        });
    });
    return {settings, writes, queries, tracingHeaders};
}

async function open(page: Page, remote = false) {
    await page.goto(
        `/database?schema=/local&database=/local&databasePage=query${remote ? '&remoteSettings=1' : ''}`,
    );
    const editor = new QueryEditor(page);
    await editor.clickGearButton();
    return page.getByRole('dialog', {name: 'Query Settings', exact: true});
}

test('dialog layout, hints, keyboard cancellation and new transaction choices', async ({page}) => {
    await mockBackend(page);
    const dialog = await open(page);
    await expect(dialog.getByRole('radio', {name: 'Full', exact: true})).toBeChecked();
    await expect(dialog.getByRole('button', {name: 'Advanced settings'})).toHaveAttribute(
        'aria-expanded',
        'false',
    );
    await expect(dialog.getByLabel('Query prefix', {exact: true})).toBeHidden();
    await page.screenshot({
        path: 'playwright-artifacts/query-settings-collapsed.png',
        animations: 'disabled',
    });
    await dialog.getByRole('combobox', {name: 'Transaction mode'}).click();
    await expect(page.getByRole('option', {name: /Snapshot Read-Write/})).toHaveCount(0);
    await expect(page.getByRole('option', {name: /Read committed/})).toHaveCount(0);
    await expect(page.getByRole('option', {name: /Online Read-Only/})).toContainText('Deprecated');
    await page.keyboard.press('Escape');
    await dialog.getByRole('button', {name: 'Advanced settings'}).click();
    await expect(dialog.getByRole('combobox', {name: 'Tracing level'})).toBeDisabled();
    await dialog.getByRole('switch', {name: 'Tracing', exact: true}).locator('..').click();
    await expect(dialog.getByRole('combobox', {name: 'Tracing level'})).toContainText('Top Level');
    await dialog.getByLabel('Query prefix', {exact: true}).fill('PRAGMA Private;');
    await page.screenshot({
        path: 'playwright-artifacts/query-settings-expanded.png',
        animations: 'disabled',
    });
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => window.querySettingsEvents)).toEqual([]);
    const editor = new QueryEditor(page);
    await editor.clickGearButton();
    await dialog.getByRole('button', {name: 'Advanced settings'}).click();
    await expect(dialog.getByLabel('Query prefix', {exact: true})).toHaveValue(
        DEFAULT_QUERY_SETTINGS.pragmas,
    );
});

for (const remote of [false, true]) {
    test(`preserves saved snapshot across Apply, cancel and reload (${remote ? 'remote' : 'local'} settings)`, async ({
        page,
    }) => {
        const backend = await mockBackend(page, {
            ...DEFAULT_QUERY_SETTINGS,
            transactionMode: TRANSACTION_MODES.snapshotrw,
        });
        let dialog = await open(page, remote);
        await expect(dialog.getByRole('combobox', {name: 'Transaction mode'})).toContainText(
            'Snapshot Read-Write',
        );
        await dialog.getByLabel('Limit rows', {exact: true}).fill('123');
        await dialog.getByRole('button', {name: 'Apply', exact: true}).click();
        await expect(dialog).toBeHidden();
        if (remote) {
            await expect
                .poll(() => JSON.parse(backend.settings.queryExecutionSettings).limitRows)
                .toBe(123);
        }
        await page.reload();
        const editor = new QueryEditor(page);
        await editor.clickGearButton();
        dialog = page.getByRole('dialog', {name: 'Query Settings', exact: true});
        await expect(dialog.getByRole('combobox', {name: 'Transaction mode'})).toContainText(
            'Snapshot Read-Write',
        );
        await expect(dialog.getByLabel('Limit rows', {exact: true})).toHaveValue('123');
        await dialog.getByRole('combobox', {name: 'Transaction mode'}).click();
        await page.getByRole('option', {name: /Serializable/}).click();
        await dialog.getByRole('button', {name: 'Cancel', exact: true}).click();
        await expect(dialog).toBeHidden();
        await editor.clickGearButton();
        await expect(dialog.getByRole('combobox', {name: 'Transaction mode'})).toContainText(
            'Snapshot Read-Write',
        );
        await dialog.getByRole('combobox', {name: 'Transaction mode'}).click();
        await page.getByRole('option', {name: /Serializable/}).click();
        await dialog.getByRole('button', {name: 'Apply', exact: true}).click();
        await expect(dialog).toBeHidden();
        if (remote) {
            await expect
                .poll(() => JSON.parse(backend.settings.queryExecutionSettings).transactionMode)
                .toBe(TRANSACTION_MODES.serializable);
        }
        await editor.clickGearButton();
        await dialog.getByRole('combobox', {name: 'Transaction mode'}).click();
        await expect(page.getByRole('option', {name: /Snapshot Read-Write/})).toHaveCount(0);
        const events = await page.evaluate(() => window.querySettingsEvents);
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            goal: 'applyQuerySettings',
            params: {transactionModeChanged: true, transactionMode: TRANSACTION_MODES.serializable},
        });
    });
}

for (const streaming of [false, true]) {
    test(`applied values reach ${streaming ? 'streaming' : 'ordinary'} query requests`, async ({
        page,
    }) => {
        const backend = await mockBackend(page, DEFAULT_QUERY_SETTINGS, 11, streaming);
        const dialog = await open(page);
        await dialog.getByLabel('Limit rows', {exact: true}).fill('25');
        await dialog.getByRole('button', {name: 'Advanced settings'}).click();
        await dialog.getByRole('switch', {name: 'Tracing', exact: true}).locator('..').click();
        await dialog.getByLabel('Query prefix', {exact: true}).fill('PRAGMA OrderedColumns;');
        if (streaming) {
            await dialog.getByLabel('Output chunk max size', {exact: true}).fill('2048');
            await dialog.getByRole('switch', {name: 'Timeout', exact: true}).locator('..').click();
        }
        await dialog.locator('#timeout').fill('7');
        await dialog.getByRole('button', {name: 'Apply', exact: true}).click();
        await expect(dialog).toBeHidden();
        const editor = new QueryEditor(page);
        await editor.setQuery('SELECT 1;');
        await editor.clickRunButton();
        await expect.poll(() => backend.queries.length).toBeGreaterThan(0);
        expect(backend.queries.at(-1)).toMatchObject({
            stats: 'full',
            limit_rows: 25,
            timeout: 7000,
            query: 'PRAGMA OrderedColumns;\n\nSELECT 1;',
        });
        expect(backend.tracingHeaders.at(-1)).toBe('4');
        expect(backend.queries.at(-1)).not.toHaveProperty('transaction_mode');
        expect(backend.queries.at(-1)).not.toHaveProperty('resource_pool');
        if (streaming) {
            expect(backend.queries.at(-1)).toMatchObject({output_chunk_max_size: 2048});
        }
    });
}

test('supports a small viewport and keyboard help', async ({page}) => {
    await mockBackend(page, DEFAULT_QUERY_SETTINGS, 11, true);
    const dialog = await open(page);
    await page.evaluate(() => localStorage.setItem('theme', 'light'));
    await page.reload();
    await new QueryEditor(page).clickGearButton();
    await dialog.getByRole('button', {name: 'Advanced settings'}).click();
    const help = dialog.getByRole('button', {name: 'Help: Output chunk max size', exact: true});
    await help.focus();
    await help.press('Enter');
    await expect(
        page.getByText(
            'Maximum size of a streamed result chunk, in bytes. Does not limit the total result size.',
            {exact: true},
        ),
    ).toBeVisible();
    await help.press('Escape');
    await page.screenshot({
        path: 'playwright-artifacts/query-settings-desktop.png',
        animations: 'disabled',
    });
    await page.setViewportSize({width: 390, height: 844});
    await dialog.getByRole('button', {name: 'Apply', exact: true}).scrollIntoViewIfNeeded();
    await expect(dialog.getByRole('button', {name: 'Apply', exact: true})).toBeInViewport();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.x).toBeGreaterThanOrEqual(0);
    expect((box?.x || 0) + (box?.width || 0)).toBeLessThanOrEqual(390);
    await page.screenshot({
        path: 'playwright-artifacts/query-settings-narrow.png',
        animations: 'disabled',
    });
});
