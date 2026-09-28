import {test as baseTest, expect} from '@playwright/test';
import type {Page, TestInfo} from '@playwright/test';

interface RowPointerEvent {
    time: number;
    x: number;
    y: number;
    rowIndex: string | null;
    isTrusted: boolean;
}
interface KeyboardInputRecord {
    protectedPath?: string;
    firstViolation?: RowPointerEvent;
    events: RowPointerEvent[];
}
type GuardWindow = Window & {__ydbKeyboardPollingInput?: KeyboardInputRecord};

async function installKeyboardInputGuard(page: Page) {
    await page.addInitScript(() => {
        const record: KeyboardInputRecord = {events: []};
        (window as GuardWindow).__ydbKeyboardPollingInput = record;
        document.addEventListener(
            'keydown',
            (event) => {
                if (
                    ['ArrowUp', 'ArrowDown'].includes(event.key) &&
                    event.target instanceof HTMLInputElement &&
                    event.target.hasAttribute('data-table-keyboard-search')
                ) {
                    record.protectedPath ??= location.pathname;
                }
            },
            {capture: true, passive: true},
        );
        document.addEventListener(
            'mousemove',
            (event) => {
                if (
                    record.protectedPath !== location.pathname ||
                    !(event.target instanceof Element)
                ) {
                    return;
                }
                const row = event.target.closest('[data-keyboard-navigation] tbody tr');
                if (!row) {
                    return;
                }
                const entry: RowPointerEvent = {
                    time: Date.now(),
                    x: event.clientX,
                    y: event.clientY,
                    rowIndex: row.getAttribute('data-row-index'),
                    isTrusted: event.isTrusted,
                };
                record.firstViolation ??= entry;
                record.events.push(entry);
                if (record.events.length > 256) {
                    record.events.shift();
                }
            },
            {capture: true, passive: true},
        );
    });
}
async function readKeyboardInput(page: Page): Promise<KeyboardInputRecord> {
    return page.evaluate(() => {
        const record = (window as GuardWindow).__ydbKeyboardPollingInput;
        if (!record) {
            throw new Error('HARNESS_PRECONDITION: keyboard input guard was not installed');
        }
        return record;
    });
}
function assertKeyboardInputClean(record: KeyboardInputRecord) {
    if (record.firstViolation) {
        throw new Error(
            'HARNESS_INPUT_INTERFERENCE: unexpected mousemove over a table row during keyboard-only validation',
        );
    }
}
const test = baseTest.extend<{keyboardInputGuard: void}>({
    keyboardInputGuard: [
        async ({page}, use, info) => {
            await installKeyboardInputGuard(page);
            await use();
            const record = await readKeyboardInput(page);
            await info.attach('keyboard-input', {
                body: JSON.stringify(
                    {
                        record,
                        originalErrors: info.errors.map(({message, stack}) => ({message, stack})),
                    },
                    null,
                    2,
                ),
                contentType: 'application/json',
            });
            if (record.firstViolation) {
                info.annotations.push({
                    type: 'HARNESS_INPUT_INTERFERENCE',
                    description:
                        'Keyboard-only precondition was violated; original assertions retained in attachment/trace.',
                });
            }
            assertKeyboardInputClean(record);
        },
        {auto: true},
    ],
});

async function artifact(info: TestInfo, name: string, value: unknown) {
    await info.attach(name, {
        body: JSON.stringify(value, null, 2),
        contentType: 'application/json',
    });
}
async function screenshot(page: Page, info: TestInfo, name: string) {
    const nodeId = new URL(page.url()).pathname.match(/^\/node\/(\d+)(?:\/|$)/)?.[1];
    if (nodeId) {
        await expect(page.getByText(`Node ${nodeId}`, {exact: true})).toBeVisible();
    }
    await page.screenshot({path: info.outputPath(name + '.png')});
}

const initialIds = Array.from({length: 82}, (_, i) => 101 + i);
const selected = '.ydb-keyboard-focused-row';
function node(id: number) {
    return {
        NodeId: id,
        SystemState: {
            Host: `node-${id}.test`,
            DataCenter: 'dc-test',
            Rack: 'rack-test',
            Version: 'fixture',
            StartTime: String(Date.now() - 3600000),
            LoadAverage: [0.1, 0.2, 0.3],
            NumberOfCpus: 8,
            SystemState: 'Green',
            MemoryUsed: '1073741824',
            MemoryLimit: '8589934592',
            Tenants: ['/local'],
        },
        CpuUsage: 1,
        UptimeSeconds: 3600,
        Disconnected: false,
        Tablets: [],
    };
}
async function scrollState(page: Page) {
    return page.evaluate(() =>
        Array.from(document.querySelectorAll('*'))
            .filter((e) => e.clientHeight > 0 && /auto|scroll/.test(getComputedStyle(e).overflowY))
            .map((e) => ({tag: e.tagName, name: e.className, top: e.scrollTop})),
    );
}
function createWave(
    nextIds: number[],
    label: string,
    options: {error?: boolean; mode?: 'independent' | 'manual'},
) {
    const first = Promise.withResolvers<void>();
    // Preserve the rejected promise for callers even if the request arrives before they await it.
    first.promise.catch(() => undefined);
    return {
        ids: [...nextIds],
        label,
        error: options.error ?? false,
        independent: options.mode !== 'manual',
        headDelivered: false,
        first,
        second: Promise.withResolvers<void>(),
        tail: Promise.withResolvers<void>(),
        completed: Promise.withResolvers<void>(),
    };
}
async function fixture(page: Page, holdInitial = false) {
    await page.addInitScript(() => localStorage.setItem('auto-refresh-interval', '15000'));
    const baseline = Promise.withResolvers<void>();
    const initialStarted = Promise.withResolvers<void>();
    const initialGate = Promise.withResolvers<void>();
    const waves: ReturnType<typeof createWave>[] = [];
    let currentWave: ReturnType<typeof createWave> | undefined;
    const timeline: unknown[] = [];
    await page.route('**/viewer/json/nodes?*', async (route) => {
        const params = new URL(route.request().url()).searchParams;
        const offset = Number(params.get('offset') || 0);
        const limit = Number(params.get('limit') || 20);
        const wave = currentWave;
        const requestPhase = wave?.label ?? 'initial';
        const snapshot = wave?.ids ?? initialIds;
        const includesTail = offset <= 20 && offset + limit > 20;
        timeline.push({event: 'request', phase: requestPhase, offset, limit, time: Date.now()});
        const rows = snapshot.slice(offset, offset + limit);
        const response = {
            Nodes: rows.map(node),
            TotalNodes: snapshot.length,
            FoundNodes: snapshot.length,
        };
        if (wave?.independent && offset === 0 && includesTail && !wave.headDelivered) {
            timeline.push({
                event: 'invalid-precondition',
                phase: requestPhase,
                offset,
                limit,
                time: Date.now(),
            });
            wave.tail.resolve();
            wave.second.resolve();
            await route.fulfill({json: response});
            wave.completed.resolve();
            wave.first.reject(
                new Error('HARNESS_PRECONDITION: first polling batch includes head and tail'),
            );
            return;
        }
        if (!wave && includesTail) {
            initialStarted.resolve();
            // Stagger initial completion so real RTK polling schedules remain independent.
            await new Promise((resolve) => setTimeout(resolve, 900));
            if (holdInitial) {
                await initialGate.promise;
            }
        }
        if (wave && includesTail) {
            wave.second.resolve();
            await wave.tail.promise;
        }
        if (wave?.error && includesTail) {
            await route.fulfill({status: 500, json: {error: 'intentional second chunk failure'}});
            timeline.push({
                event: 'response',
                phase: requestPhase,
                offset,
                limit,
                status: 500,
                time: Date.now(),
            });
            wave.completed.resolve();
            return;
        }
        await route.fulfill({json: response});
        timeline.push({
            event: 'response',
            phase: requestPhase,
            offset,
            limit,
            status: 200,
            ids: rows,
            time: Date.now(),
        });
        if (!wave && includesTail) {
            baseline.resolve();
        }
        if (wave && includesTail) {
            wave.completed.resolve();
        }
        if (wave && offset === 0) {
            wave.headDelivered = true;
            wave.first.resolve();
        }
    });
    return {
        timeline,
        baseline: baseline.promise,
        initialTailRequest: initialStarted.promise,
        releaseInitial: () => initialGate.resolve(),
        releaseAll: () => {
            initialGate.resolve();
            waves.forEach((wave) => wave.tail.resolve());
        },
        arm(
            nextIds: number[],
            label: string,
            options: {error?: boolean; mode?: 'independent' | 'manual'} = {},
        ) {
            const wave = createWave(nextIds, label, options);
            waves.push(wave);
            currentWave = wave;
            if (!wave.independent) {
                wave.tail.resolve();
            }
            return {
                first: wave.first.promise,
                second: wave.second.promise,
                done: wave.completed.promise,
                release: () => wave.tail.resolve(),
            };
        },
    };
}
async function choose(page: Page, id: number) {
    await page.goto('/cluster/nodes');
    const search = page.getByRole('textbox', {name: 'Host name', exact: true});
    await expect(page.getByRole('link', {name: 'node-101.test', exact: true})).toBeVisible();
    await page.mouse.move(0, 0);
    await search.focus();
    for (let value = 102; value <= id; value++) {
        await search.press('ArrowDown');
    }
    await expect(page.locator(selected)).toContainText(`node-${id}.test`);
    await expect(search).toBeFocused();
    return search;
}
async function stabilizeSelection(page: Page, search: ReturnType<Page['getByRole']>, id: number) {
    await expect(
        page.getByRole('link', {name: `node-${Math.min(182, id + 1)}.test`, exact: true}),
    ).toBeAttached();
    // Establish the selection after all initially fetched chunks have populated the cache.
    // Selecting before the initial tail completes is a distinct extra scenario.
    await search.press('ArrowUp');
    await search.press('ArrowDown');
    await expect(page.locator(selected)).toContainText(`node-${id}.test`);
}

for (const error of [false, true]) {
    test(`R420-07 preserves selected ID across ${error ? 'HTTP500' : 'delayed'} neighboring chunk`, async ({
        page,
    }, info) => {
        test.setTimeout(75000);
        const mock = await fixture(page);
        try {
            const search = await choose(page, 120);
            await mock.baseline;
            await stabilizeSelection(page, search, 120);
            const before = page.url();
            const scrollBefore = await scrollState(page);
            const wave = mock.arm([100, ...initialIds], error ? 'error' : 'delayed', {error});
            await wave.first;
            await expect(page.locator(selected)).toHaveCount(0);
            expect(await scrollState(page), 'Polling itself must not scroll').toEqual(scrollBefore);
            await expect(search).toBeFocused();
            await page.keyboard.press('Enter');
            expect(page.url()).toBe(before);
            await screenshot(page, info, 'pending-no-wrong-target');
            await wave.second;
            // The 0.9-second gap is part of the scenario, not a readiness sleep.
            await new Promise((resolve) => setTimeout(resolve, 900));
            const failed = error
                ? page.waitForResponse(
                      (r) => r.url().includes('/viewer/json/nodes?') && r.status() === 500,
                  )
                : undefined;
            wave.release();
            if (failed) {
                await (await failed).finished();
                await expect(page.locator(selected)).toHaveCount(0);
                await expect(search).toBeFocused();
                await page.keyboard.press('Enter');
                expect(page.url()).toBe(before);
                await screenshot(page, info, 'failed-chunk-no-fallback');
                const recovery = mock.arm([100, ...initialIds], 'recovery');
                await recovery.first;
                await recovery.second;
                recovery.release();
            }
            await expect(page.locator(selected)).toContainText('node-120.test');
            await expect(search).toBeFocused();
            await page.keyboard.press('Enter');
            await expect(page).toHaveURL(/\/node\/120(?:[/?]|$)/);
            await screenshot(page, info, 'selected-120-opened');
        } finally {
            mock.releaseAll();
            await artifact(info, 'request-timeline', mock.timeline);
        }
    });
}

test('R420-07 removed selected ID falls forward without another polling interval', async ({
    page,
}, info) => {
    test.setTimeout(60000);
    const mock = await fixture(page);
    try {
        const search = await choose(page, 121);
        await mock.baseline;
        await stabilizeSelection(page, search, 121);
        const wave = mock.arm(
            initialIds.filter((id) => id !== 121),
            'delete-121',
        );
        await wave.first;
        await wave.second;
        wave.release();
        await expect(page.locator(selected)).toContainText('node-122.test', {timeout: 5000});
        await expect(search).toBeFocused();
        await screenshot(page, info, 'deleted-id-fallback-122');
        await expect(search).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(/\/node\/122(?:[/?]|$)/);
    } finally {
        mock.releaseAll();
        await artifact(info, 'request-timeline', mock.timeline);
    }
});

for (const headFirst of [false, true]) {
    test(`R420-07 partial initial selection: head before initial tail=${headFirst}`, async ({
        page,
    }, info) => {
        test.setTimeout(60000);
        const mock = await fixture(page, true);
        try {
            const search = await choose(page, 120);
            const before = page.url();
            await mock.initialTailRequest;
            if (!headFirst) {
                mock.releaseInitial();
                await mock.baseline;
                await expect(
                    page.getByRole('link', {name: 'node-121.test', exact: true}),
                ).toBeAttached();
            }
            const wave = mock.arm([100, ...initialIds], 'partial-initial-selection');
            await wave.first;
            await expect(page.getByText('Nodes: 83', {exact: true})).toBeVisible();
            if (headFirst) {
                mock.releaseInitial();
                await mock.baseline;
                await expect(
                    page.getByRole('link', {name: 'node-121.test', exact: true}),
                ).toBeAttached();
            }
            await artifact(info, 'selected-before-enter', {
                rows: await page.locator(selected).allTextContents(),
                url: page.url(),
            });
            await expect(search).toBeFocused();
            await page.keyboard.press('Enter');
            await screenshot(page, info, 'initial-load-selection-enter-target');
            await artifact(info, 'actual-enter-target', {before, after: page.url()});
            expect(page.url(), 'Pending lookup must not activate shifted neighbor119').toBe(before);
            await expect(page.locator(selected)).toHaveCount(0);
            await expect(search).toBeFocused();
            await wave.second;
            wave.release();
            await expect(page.locator(selected)).toContainText('node-120.test');
            await expect(search).toBeFocused();
            await page.keyboard.press('Enter');
            await expect(page).toHaveURL(/\/node\/120(?:[/?]|$)/);
            await screenshot(page, info, 'recovered-120-opened');
        } finally {
            mock.releaseAll();
            await artifact(info, 'request-timeline', mock.timeline);
        }
    });
}

for (const empty of [false, true]) {
    test(`R420-07 manual refresh after ${empty ? 'all rows' : 'last selected row'} removal`, async ({
        page,
    }, info) => {
        const mock = await fixture(page);
        try {
            const search = await choose(page, empty ? 121 : 182);
            await mock.baseline;
            await stabilizeSelection(page, search, empty ? 121 : 182);
            const before = page.url();
            const wave = mock.arm(
                empty ? [] : initialIds.slice(0, -1),
                empty ? 'empty' : 'delete-last',
                {mode: 'manual'},
            );
            wave.release(); // Manual refresh batches active chunks; this is an intentional separate case.
            await page.getByRole('button', {name: 'Refresh', exact: true}).click();
            await search.focus();
            if (empty) {
                await expect(
                    page.locator('a[href*="/node/"]').filter({hasText: /node-\d+\.test/}),
                ).toHaveCount(0);
                await expect(page.locator(selected)).toHaveCount(0);
                await expect(search).toBeFocused();
                await page.keyboard.press('Enter');
                expect(page.url()).toBe(before);
            } else {
                await expect(page.locator(selected)).toContainText('node-181.test');
                await expect(search).toBeFocused();
                await page.keyboard.press('Enter');
                await expect(page).toHaveURL(/\/node\/181(?:[/?]|$)/);
            }
            await screenshot(page, info, empty ? 'empty-no-navigation' : 'last-row-fallback');
        } finally {
            mock.releaseAll();
            await artifact(info, 'request-timeline', mock.timeline);
        }
    });
}

test('R420-07 selected identity remains stable through three polling cycles', async ({
    page,
}, info) => {
    test.setTimeout(85000);
    const mock = await fixture(page);
    try {
        const search = await choose(page, 120);
        await mock.baseline;
        await stabilizeSelection(page, search, 120);
        for (let cycle = 1; cycle <= 3; cycle++) {
            const wave = mock.arm([100, ...initialIds], `cycle-${cycle}`);
            await wave.first;
            await wave.second;
            wave.release();
            await wave.done;
            await expect(page.locator(selected)).toContainText('node-120.test');
            await expect(search).toBeFocused();
        }
        await expect(search).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(/\/node\/120(?:[/?]|$)/);
    } finally {
        mock.releaseAll();
        await artifact(info, 'request-timeline', mock.timeline);
    }
});

baseTest(
    'fixture rejects a full first polling batch without waiting for tail release',
    async ({page}) => {
        await page.route('**/__keyboard-fixture', (route) =>
            route.fulfill({
                contentType: 'text/html',
                body: '<!doctype html><title>Fixture contract</title>',
            }),
        );
        const mock = await fixture(page);
        await page.goto('/__keyboard-fixture');
        const wave = mock.arm([100, ...initialIds], 'full-first');
        let outcome = 'pending';
        const first = wave.first.then(
            () => {
                outcome = 'fulfilled';
            },
            (error: Error) => {
                outcome = error.message;
            },
        );
        const response = page.evaluate(() =>
            fetch('/viewer/json/nodes?offset=0&limit=100').then((r) => r.json()),
        );
        try {
            await expect.poll(() => outcome, {timeout: 1000}).toContain('HARNESS_PRECONDITION');
        } finally {
            mock.releaseAll();
            await response;
            await first;
        }
    },
);

async function openInputFixture(page: Page) {
    await page.route('**/__keyboard-fixture', (route) =>
        route.fulfill({
            contentType: 'text/html',
            body: '<!doctype html><input data-table-keyboard-search aria-label="Filter"><div data-keyboard-navigation><table><tbody><tr data-row-index="0"><td>Node 120</td></tr></tbody></table></div>',
        }),
    );
    await page.goto('/__keyboard-fixture');
    await page.mouse.move(0, 0);
    await page.getByRole('textbox').focus();
    await page.keyboard.press('ArrowDown');
}

baseTest('fixture input guard permits the pointer outside rows', async ({page}) => {
    await installKeyboardInputGuard(page);
    await openInputFixture(page);
    await page.mouse.move(1, 1);
    const record = await readKeyboardInput(page);
    expect(record.events).toEqual([]);
    expect(() => assertKeyboardInputClean(record)).not.toThrow();
});

for (const trusted of [false, true]) {
    baseTest(
        `fixture input guard retains row movement regardless of isTrusted=${trusted}`,
        async ({page}) => {
            await installKeyboardInputGuard(page);
            await openInputFixture(page);
            const row = page.locator('[data-row-index="0"]');
            if (trusted) {
                await row.hover();
            } else {
                await row.dispatchEvent('mousemove', {clientX: 20, clientY: 40});
            }
            await page.mouse.move(0, 0);
            await page.keyboard.press('ArrowUp');
            const record = await readKeyboardInput(page);
            expect(record.firstViolation).toMatchObject({rowIndex: '0', isTrusted: trusted});
            expect(record.events).toContainEqual(record.firstViolation);
            expect(() => assertKeyboardInputClean(record)).toThrow('HARNESS_INPUT_INTERFERENCE');
        },
    );
}

baseTest('fixture accepts a full manual refresh batch', async ({page}) => {
    const mock = await fixture(page);
    await openInputFixture(page);
    const wave = mock.arm([100, ...initialIds], 'manual-contract', {mode: 'manual'});
    try {
        const result = await page.evaluate(() =>
            fetch('/viewer/json/nodes?offset=0&limit=100').then((response) => response.json()),
        );
        await wave.first;
        expect(result.Nodes.map((row: {NodeId: number}) => row.NodeId)).toEqual([
            100,
            ...initialIds,
        ]);
    } finally {
        mock.releaseAll();
    }
});

baseTest('fixture accepts a combined tail batch after an independent head', async ({page}) => {
    const mock = await fixture(page);
    await openInputFixture(page);
    const wave = mock.arm([100, ...initialIds], 'combined-tail');
    try {
        await page.evaluate(() =>
            fetch('/viewer/json/nodes?offset=0&limit=20').then((response) => response.json()),
        );
        await wave.first;
        const response = page.evaluate(() =>
            fetch('/viewer/json/nodes?offset=0&limit=100').then((result) => result.json()),
        );
        await wave.second;
        let completed = false;
        const completion = wave.done.then(() => {
            completed = true;
        });
        await Promise.resolve();
        expect(completed).toBe(false);
        wave.release();
        await completion;
        const result = await response;
        expect(result.Nodes.map((row: {NodeId: number}) => row.NodeId)).toEqual([
            100,
            ...initialIds,
        ]);
    } finally {
        mock.releaseAll();
    }
});

baseTest('fixture cleanup releases both initial and polling tails', async ({page}) => {
    const mock = await fixture(page, true);
    await openInputFixture(page);
    const initialResponse = page.evaluate(() =>
        fetch('/viewer/json/nodes?offset=20&limit=80').then((response) => response.json()),
    );
    await mock.initialTailRequest;
    const wave = mock.arm([100, ...initialIds], 'cleanup');
    await page.evaluate(() =>
        fetch('/viewer/json/nodes?offset=0&limit=20').then((response) => response.json()),
    );
    await wave.first;
    const pollingResponse = page.evaluate(() =>
        fetch('/viewer/json/nodes?offset=20&limit=80').then((response) => response.json()),
    );
    try {
        await wave.second;
    } finally {
        mock.releaseAll();
    }
    expect((await initialResponse).Nodes[0].NodeId).toBe(121);
    expect((await pollingResponse).Nodes[0].NodeId).toBe(120);
});
