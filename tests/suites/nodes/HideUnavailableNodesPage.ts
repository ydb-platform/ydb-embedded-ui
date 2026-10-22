import {expect} from '@playwright/test';
import type {Page} from '@playwright/test';

import {PageModel} from '../../models/PageModel';

export class HideUnavailableNodesPage extends PageModel {
    readonly toggleControl = this.selector.getByTestId('hide-unavailable-nodes');
    readonly toggle = this.toggleControl.getByRole('switch');
    readonly count = this.selector.locator('.ydb-entities-count');

    constructor(page: Page, storage = false) {
        super(
            page,
            storage ? 'cluster/storage' : 'database',
            storage
                ? {type: 'nodes'}
                : {
                      database: '/local',
                      schema: '/local',
                      databasePage: 'diagnostics',
                      diagnosticsTab: 'nodes',
                  },
        );
    }

    node(host: string) {
        return this.selector.locator('table').getByText(host, {exact: true});
    }

    group() {
        return this.selector.getByRole('button', {name: /test-dc/});
    }

    async expectToolbarLayout(storage: boolean) {
        const toolbar = this.selector
            .locator('.ydb-table-with-controls-layout__controls-wrapper')
            .filter({has: this.page.getByTestId('hide-unavailable-nodes')});
        const search = toolbar.getByRole('textbox');
        const groupBy = toolbar.locator('.g-select');
        const columnSetup = toolbar
            .locator('.ydb-table-with-controls-layout__extra-controls')
            .getByRole('button');
        const controls = storage
            ? [
                  search,
                  toolbar.getByTestId('storage-type-filter'),
                  groupBy,
                  this.count,
                  toolbar.getByRole('button', {name: 'Expert mode', exact: true}),
                  this.toggleControl,
                  columnSetup,
              ]
            : [search, groupBy, this.toggleControl, this.count, columnSetup];

        for (const control of controls) {
            await expect(control).toBeInViewport({ratio: 1});
        }

        const boxes = await Promise.all(controls.map((control) => control.boundingBox()));
        expect(boxes).not.toContain(null);
        const visibleBoxes = boxes.filter((box) => box !== null);
        const firstBox = visibleBoxes[0];
        for (let index = 1; index < visibleBoxes.length; index++) {
            const box = visibleBoxes[index];
            const previous = visibleBoxes[index - 1];
            expect(box.x).toBeGreaterThanOrEqual(previous.x + previous.width);
            expect(
                Math.abs(box.y + box.height / 2 - (firstBox.y + firstBox.height / 2)),
            ).toBeLessThanOrEqual(2);
        }

        const label = this.toggleControl.getByText('Hide unavailable', {exact: true});
        await expect(label).toBeVisible();
        await expect(label).toBeInViewport({ratio: 1});
        expect(
            await label.evaluate((element) => {
                const range = document.createRange();
                range.selectNodeContents(element);
                const text = range.getBoundingClientRect();
                const bounds = element.getBoundingClientRect();
                const control = element.parentElement?.getBoundingClientRect();
                return {
                    lines: range.getClientRects().length,
                    fits: Boolean(
                        control &&
                            text.width <= bounds.width + 1 &&
                            text.height <= bounds.height + 1 &&
                            text.left >= control.left &&
                            text.right <= control.right + 1,
                    ),
                };
            }),
        ).toEqual({lines: 1, fits: true});
    }
}
