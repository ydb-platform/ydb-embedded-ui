import {expect, test} from '@playwright/test';

import {database} from '../../../../utils/constants';
import {DiagnosticsNodesTable} from '../../../paginatedTable/paginatedTable';
import {TenantPage} from '../../TenantPage';
import {Diagnostics, DiagnosticsTab} from '../Diagnostics';

test.describe('Nodes tab', () => {
    for (const databasePage of ['database', 'diagnostics'] as const) {
        test(`shows nodes table with memory viewer on ${databasePage} page`, async ({page}) => {
            const pageQueryParams = {
                schema: database,
                database,
                databasePage,
            };
            const tenantPage = new TenantPage(page);
            await tenantPage.goto(pageQueryParams);

            const diagnostics = new Diagnostics(page);
            await diagnostics.clickTab(DiagnosticsTab.Nodes);

            await expect(page).toHaveURL(new RegExp(`databasePage=${databasePage}`));
            await expect(page).toHaveURL(/diagnosticsTab=nodes/);

            // Check nodes table is visible
            await expect(diagnostics.nodes.table).toBeVisible();

            // Enable Memory column to show memory viewer
            const paginatedTable = new DiagnosticsNodesTable(page);
            await paginatedTable.waitForTableVisible();
            await paginatedTable.waitForTableData();
            const controls = paginatedTable.getControls();
            await controls.openColumnSetup();
            await controls.setColumnChecked('Memory');

            // Check memory viewer is present and visible
            await diagnostics.memoryViewer.waitForVisible();
            await expect(diagnostics.memoryViewer.isVisible()).resolves.toBe(true);
        });
    }
});
