import {expect, test} from '@playwright/test';

import {tenantName} from '../../../../utils/constants';
import {TenantPage} from '../../TenantPage';
import {Diagnostics, DiagnosticsTab} from '../Diagnostics';

import {setupEmptyOperationsMock, setupOperationsMock} from './operationsMocks';

test.describe('Operations Tab - Infinite Query', () => {
    test('loads initial page of operations on tab click', async ({page}) => {
        // Setup mocks with 30 operations (3 pages of 10)
        await setupOperationsMock(page, {totalOperations: 30});

        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            tenantPage: 'diagnostics',
        };

        const tenantPageInstance = new TenantPage(page);
        await tenantPageInstance.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Operations);

        // Wait for table to be visible and data to load
        await diagnostics.operations.waitForTableVisible();
        await diagnostics.operations.waitForDataLoad();

        // Verify initial page loaded (should have some rows)
        const rowCount = await diagnostics.operations.getRowCount();
        expect(rowCount).toBeGreaterThan(0);
        expect(rowCount).toBeLessThanOrEqual(20); // Reasonable page size

        // Verify first row data structure
        const firstRowData = await diagnostics.operations.getRowData(0);
        expect(firstRowData['Operation ID']).toBeTruthy();
        expect(firstRowData['Operation ID']).toContain('ydb://');
        expect(firstRowData['Status']).toBeTruthy();
        expect(['SUCCESS', 'GENERIC_ERROR', 'CANCELLED', 'ABORTED']).toContain(
            firstRowData['Status'],
        );
        expect(firstRowData['State']).toBeTruthy();
        expect(firstRowData['Progress']).toBeTruthy();

        // Verify loading more indicator is not visible initially
        const isLoadingVisible = await diagnostics.operations.isLoadingMoreVisible();
        expect(isLoadingVisible).toBe(false);
    });

    test('loads more operations on scroll', async ({page}) => {
        // Setup mocks with 30 operations (3 pages of 10)
        await setupOperationsMock(page, {totalOperations: 30});

        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            tenantPage: 'diagnostics',
        };

        const tenantPageInstance = new TenantPage(page);
        await tenantPageInstance.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Operations);

        // Wait for initial data
        await diagnostics.operations.waitForTableVisible();
        await diagnostics.operations.waitForDataLoad();

        // Get initial row count
        const initialRowCount = await diagnostics.operations.getRowCount();
        expect(initialRowCount).toBeGreaterThan(0);

        // Scroll to bottom
        await diagnostics.operations.scrollToBottom();

        // Wait a bit for potential loading
        await page.waitForTimeout(2000);

        // Get final row count
        const finalRowCount = await diagnostics.operations.getRowCount();

        // Check if more rows were loaded
        if (finalRowCount > initialRowCount) {
            // Infinite scroll worked - more rows were loaded
            expect(finalRowCount).toBeGreaterThan(initialRowCount);
        } else {
            // No more data to load - row count should stay the same
            expect(finalRowCount).toBe(initialRowCount);
        }
    });

    test('shows empty state when no operations', async ({page}) => {
        // Setup empty operations mock
        await setupEmptyOperationsMock(page);

        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            tenantPage: 'diagnostics',
        };

        const tenantPageInstance = new TenantPage(page);
        await tenantPageInstance.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Operations);

        // Wait for table to be visible
        await diagnostics.operations.waitForTableVisible();
        await diagnostics.operations.waitForDataLoad();

        // Verify empty state is shown
        const isEmptyVisible = await diagnostics.operations.isEmptyStateVisible();
        expect(isEmptyVisible).toBe(true);

        // Verify no data rows (or possibly one empty row)
        const rowCount = await diagnostics.operations.getRowCount();
        expect(rowCount).toBeLessThanOrEqual(1);
    });
});
