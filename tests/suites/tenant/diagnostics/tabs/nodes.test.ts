import {expect, test} from '@playwright/test';

import {database} from '../../../../utils/constants';
import {DiagnosticsNodesTable} from '../../../paginatedTable/paginatedTable';
import {TenantPage} from '../../TenantPage';
import {Diagnostics, DiagnosticsTab} from '../Diagnostics';

test.describe('Diagnostics Nodes tab', async () => {
    test('Nodes tab shows nodes table with memory viewer', async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'diagnostics',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Nodes);

        // Check nodes table is visible
        await expect(diagnostics.nodes.table).toBeVisible();

        // Enable Memory column to show memory viewer
        const paginatedTable = new DiagnosticsNodesTable(page);
        await paginatedTable.waitForTableVisible();
        await paginatedTable.waitForTableData();
        const controls = paginatedTable.getControls();
        await controls.openColumnSetup();
        await controls.setColumnChecked('Memory');
        await controls.applyColumnVisibility();

        // Check memory viewer is present and visible
        await diagnostics.memoryViewer.waitForVisible();
        await expect(diagnostics.memoryViewer.isVisible()).resolves.toBe(true);
    });
});
