import {expect, test} from '@playwright/test';

import {dsVslotsSchema, tenantName} from '../../../utils/constants';
import {DiagnosticsNodesTable} from '../../paginatedTable/paginatedTable';
import {NavigationTabs, TenantPage} from '../TenantPage';
import {longRunningQuery} from '../constants';
import {QueryEditor} from '../queryEditor/models/QueryEditor';

import {Diagnostics, DiagnosticsTab, QueriesSwitch} from './Diagnostics';

test.describe('Diagnostics tab', async () => {
    test('Info tab shows main page elements', async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            tenantPage: 'diagnostics',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Info);
        await expect(diagnostics.areInfoCardsVisible()).resolves.toBe(true);
    });

    test('Info tab shows resource utilization', async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            tenantPage: 'diagnostics',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Info);

        const utilization = await diagnostics.getResourceUtilization();
        expect(utilization.cpu.system).toMatch(/\d+(\.\d+)? \/ \d+/);
        expect(utilization.cpu.user).toMatch(/\d+(\.\d+)? \/ \d+/);
        expect(utilization.cpu.ic).toMatch(/\d+(\.\d+)? \/ \d+/);
        expect(utilization.storage).toBeTruthy();
        expect(utilization.memory).toMatch(/\d+ \/ \d+\s*GB/);
    });

    test('Info tab shows healthcheck status', async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            tenantPage: 'diagnostics',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Info);

        const status = await diagnostics.getHealthcheckStatus();
        expect(status).toBe('GOOD');
    });

    test('Storage tab shows Groups and Nodes views', async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            tenantPage: 'diagnostics',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Storage);

        // Check Groups view
        await diagnostics.storage.selectEntityType('Groups');
        await expect(diagnostics.storage.table).toBeVisible();

        // Check Nodes view
        await diagnostics.storage.selectEntityType('Nodes');
        await expect(diagnostics.storage.table).toBeVisible();
    });

    test('Nodes tab shows nodes table with memory viewer', async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
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

    test('Primary keys header is visible in Schema tab', async ({page}) => {
        const pageQueryParams = {
            schema: dsVslotsSchema,
            database: tenantName,
            tenantPage: 'diagnostics',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const objectSummary = new Diagnostics(page);

        await objectSummary.clickTab(DiagnosticsTab.Schema);
        await expect(objectSummary.isSchemaViewerVisible()).resolves.toBe(true);

        await expect(objectSummary.getPrimaryKeys()).resolves.toEqual([
            'NodeId',
            'PDiskId',
            'VSlotId',
        ]);
    });

    test('No runnning queries in Queries if no queries are running', async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            tenantPage: 'diagnostics',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Queries);
        await diagnostics.clickRadioSwitch(QueriesSwitch.Running);
        await diagnostics.table.hasNoData();
    });

    test('Running query is shown if query is running', async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            tenantPage: 'query',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const queryEditor = new QueryEditor(page);

        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.clickRunButton();
        await page.waitForTimeout(500);
        const statusElement = await queryEditor.getExecutionStatus();
        await expect(statusElement).toBe('Running');
        await tenantPage.selectNavigationTab(NavigationTabs.Diagnostics);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Queries);
        await diagnostics.clickRadioSwitch(QueriesSwitch.Running);
        expect(
            await diagnostics.table.waitForCellValueByHeader(1, 'Query text', longRunningQuery),
        ).toBe(true);
    });
});
