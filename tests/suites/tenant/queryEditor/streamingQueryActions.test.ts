import {expect, test} from '@playwright/test';

import {backend, database} from '../../../utils/constants';
import {QueryEditorMode, TenantPage} from '../TenantPage';
import {ObjectSummary} from '../summary/ObjectSummary';

const queryText = [
    String.raw`$pattern = "a\\Qb\\Ec";`,
    String.raw`-- Keep \} and \$name and ` + '${1:user_text}',
    'INSERT INTO `out` (Data)',
    'SELECT Data FROM `in` WHERE Data REGEXP $pattern;',
].join('\n');

for (const mode of [QueryEditorMode.SingleTab, QueryEditorMode.MultiTab]) {
    for (const {name, identifier} of [
        {name: 'q1', identifier: 'q1'},
        {name: String.raw`q1\xtz`, identifier: String.raw`q1\\xtz`},
    ]) {
        test(`Alter streaming query preserves escapes for ${name} in ${mode}`, async ({page}) => {
            const path = `${database}/${name}`;
            const infoQueries: string[] = [];

            await page.route(`${backend}/viewer/json/describe?*`, async (route) => {
                const url = new URL(route.request().url());
                const requestedPath = url.searchParams.get('path');
                const isRoot = requestedPath === database && url.searchParams.get('subs') === '1';
                if (!isRoot && requestedPath !== path) {
                    await route.continue();
                    return;
                }

                const query = {Name: name, PathType: 'EPathTypeStreamingQuery'};
                await route.fulfill({
                    json: {
                        Status: 'StatusSuccess',
                        Path: requestedPath,
                        PathDescription: isRoot
                            ? {
                                  Self: {Name: 'local', PathType: 'EPathTypeSubDomain'},
                                  Children: [query],
                              }
                            : {Self: query},
                    },
                });
            });
            await page.route(`${backend}/viewer/json/query?*`, async (route) => {
                const body = route.request().postDataJSON() as {query?: string};
                if (!body.query?.includes('`.sys/streaming_queries`')) {
                    await route.continue();
                    return;
                }

                infoQueries.push(body.query);
                await route.fulfill({
                    json: {
                        version: 12,
                        result: [
                            {
                                columns: [{name: 'Text', type: 'Utf8?'}],
                                rows: [[queryText]],
                            },
                        ],
                    },
                });
            });

            const tenantPage = new TenantPage(page);
            await tenantPage.gotoQueryEditor({schema: database, database, mode});

            const objectSummary = new ObjectSummary(page);
            const responsePromise = page.waitForResponse((response) => {
                return (
                    response.url().includes('/viewer/json/query') &&
                    response.request().postDataJSON()?.query?.includes('`.sys/streaming_queries`')
                );
            });
            await objectSummary.clickActionsButton(name);
            await (await responsePromise).finished();
            await expect
                .poll(() => objectSummary.isActionItemLoading('Alter query text...'))
                .toBe(false);
            await objectSummary.clickActionsMenuItem('Alter query text...');

            await expect
                .poll(async () =>
                    (await tenantPage.queryEditor.getEditorContent()).replace(/\r\n/g, '\n'),
                )
                .toBe(
                    `ALTER STREAMING QUERY \`${identifier}\` SET (
    FORCE = TRUE, -- Allow to drop last query checkpoint if query state can't be loaded
) AS
DO BEGIN

${queryText}

END DO;`,
                );
            expect(infoQueries).toContainEqual(
                expect.stringContaining(`WHERE Path = '${database}/${identifier}'\nLIMIT 1`),
            );
        });
    }
}
