import {expect, test} from '@playwright/test';

import {Authentication} from '../../models/Authentication';
import {backend} from '../../utils/constants';
import {QueryEditor} from '../tenant/queryEditor/models/QueryEditor';

test.describe('Authentication', () => {
    let authenticated: boolean;
    let capabilitiesRequests: number;
    let documentRequests: number;

    test.beforeEach(async ({page}) => {
        authenticated = false;
        capabilitiesRequests = 0;
        documentRequests = 0;
        page.on('request', (request) => {
            if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
                documentRequests += 1;
            }
        });
        await page.route(`${backend}/**`, async (route) => {
            const {pathname} = new URL(route.request().url());
            if (pathname === '/login') {
                const {password} = route.request().postDataJSON();
                authenticated = password === 'test-password';
                await route.fulfill({
                    status: authenticated ? 200 : 403,
                    json: authenticated ? {} : {error: 'Invalid password'},
                });
            } else if (pathname === '/viewer/json/whoami') {
                await route.fulfill({
                    status: authenticated ? 200 : 401,
                    json: authenticated
                        ? {UserSID: 'test-user', IsViewerAllowed: true}
                        : {error: 'Unauthorized'},
                });
            } else if (pathname === '/viewer/capabilities') {
                capabilitiesRequests += 1;
                await route.fulfill({json: {Settings: {Security: {UseLoginProvider: true}}}});
            } else if (pathname === '/viewer/json/cluster') {
                await route.fulfill({json: {Domain: '/authenticated-cluster'}});
            } else if (pathname === '/viewer/json/nodelist') {
                await route.fulfill({json: []});
            } else if (pathname === '/viewer/json/tenantinfo') {
                await route.fulfill({json: {TenantInfo: [{Name: '/local'}]}});
            } else if (pathname === '/viewer/json/describe') {
                await route.fulfill({
                    json: {Path: '/local', PathDescription: {Self: {PathType: 'SubDomain'}}},
                });
            } else {
                await route.fulfill({json: {}});
            }
        });
    });

    test('reloads after inline login and refetches capabilities and page data', async ({page}) => {
        await page.goto('cluster/databases?database=%2Flocal#details');
        const auth = new Authentication(page);
        await expect(auth.selector).toBeVisible();
        const originalUrl = page.url();
        const originalCapabilitiesRequests = capabilitiesRequests;

        await auth.signIn();

        await expect.poll(() => documentRequests).toBe(2);
        await expect(page).toHaveURL(originalUrl);
        await expect.poll(() => capabilitiesRequests).toBeGreaterThan(originalCapabilitiesRequests);
        await expect(page.locator('.ydb-cluster__title')).toContainText('AUTHENTICATED-CLUSTER');
        await expect(auth.selector).toBeHidden();
    });

    test('loads the saved return URL as a new document after login', async ({page, baseURL}) => {
        const returnTo = new URL('cluster/databases?database=%2Flocal#details', baseURL);
        const query = new URLSearchParams({returnUrl: encodeURIComponent(returnTo.href)});
        await page.goto(`auth?${query}`);

        await Promise.all([
            page.waitForURL(returnTo.href, {waitUntil: 'commit'}),
            new Authentication(page).signIn(),
        ]);

        await expect.poll(() => documentRequests).toBe(2);
        await expect(page.locator('.ydb-cluster__title')).toContainText('AUTHENTICATED-CLUSTER');
        expect(new URL(page.url()).pathname).toBe('/cluster/databases');
        expect(new URL(page.url()).searchParams.get('database')).toBe('/local');
    });

    ['auth', 'auth?returnUrl=%25invalid'].forEach((authPath) => {
        test(`returns to the cluster after login at ${authPath}`, async ({page}) => {
            await page.goto(authPath);

            await new Authentication(page).signIn();

            await expect.poll(() => documentRequests).toBe(2);
            await expect(page).toHaveURL(/\/cluster(?:\/databases)?(?:\?|$)/);
            await expect(page.locator('.ydb-cluster__title')).toContainText(
                'AUTHENTICATED-CLUSTER',
            );
        });
    });

    test('keeps the form and displays the error after a failed login', async ({page}) => {
        await page.goto('auth');
        const auth = new Authentication(page);

        await auth.signIn('wrong-password');

        await expect(auth.selector.getByText('Invalid password', {exact: true})).toBeVisible();
        await expect(auth.selector).toBeVisible();
        expect(documentRequests).toBe(1);
    });

    test('preserves the SSO home fallback in single-cluster mode', async ({page, baseURL}) => {
        await page.route('**/ui/auth', async (route) => {
            const response = await route.fetch();
            const html = (await response.text()).replace(
                '</head>',
                `<script>
                    window.web_version = 'true';
                    window.meta_backend = 'undefined';
                    window.multi_cluster_mode = 'false';
                    window.custom_backend = ${JSON.stringify(backend)};
                </script></head>`,
            );
            await route.fulfill({response, body: html});
        });
        await page.route(new URL('capabilities', baseURL).href, async (route) => {
            await route.fulfill({
                json: {
                    Capabilities: {'/meta/oidc/authorize': 1, '/meta/oidc/callback': 1},
                },
            });
        });
        await page.goto('ui/auth');

        const auth = new Authentication(page);
        const ssoLink = auth.selector.getByRole('link', {name: 'via SSO', exact: true});
        const expectedUrl = new URL('/meta/oidc/authorize', baseURL);
        expectedUrl.protocol = 'https:';
        expectedUrl.searchParams.set(
            'return_to',
            `/ui/home?backend=${encodeURIComponent(backend)}`,
        );

        await expect(ssoLink).toHaveAttribute('href', expectedUrl.href);
    });

    test('restores SQL tabs and draft text after login reload', async ({page}) => {
        await page.addInitScript(() => {
            window.e2eQueryEditorMode = 'multi-tab';
        });
        await page.goto('database?database=%2Flocal&schema=%2Flocal&databasePage=query');
        const auth = new Authentication(page);
        await expect(auth.selector).toBeVisible();
        await page.evaluate(() => {
            sessionStorage.setItem(
                'query_editor_current_query',
                JSON.stringify({
                    activeTabId: 'draft',
                    tabsOrder: ['draft'],
                    tabsById: {
                        draft: {
                            id: 'draft',
                            title: 'Login draft',
                            isTitleUserDefined: true,
                            input: 'SELECT 42 AS preserved_draft;',
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                }),
            );
            sessionStorage.setItem('query_editor_dirty', JSON.stringify({draft: true}));
        });

        await auth.signIn();

        await expect.poll(() => documentRequests).toBe(2);
        const editor = new QueryEditor(page);
        await expect.poll(() => editor.getEditorContent()).toBe('SELECT 42 AS preserved_draft;');
        await expect(editor.editorTabs.getActiveTabTitle()).resolves.toBe('Login draft');
    });
});
