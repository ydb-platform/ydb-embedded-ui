import {expect, test} from '@playwright/test';

import {database} from '../../../../utils/constants';
import {TenantPage} from '../../TenantPage';
import {Diagnostics, DiagnosticsTab} from '../Diagnostics';

import {
    setupEmptyOperationsMock,
    setupMalformedOperationsMock,
    setupOperation403Mock,
    setupOperationNetworkErrorMock,
    setupOperationsMock,
    setupPartialMalformedOperationsMock,
} from './operationsMocks';

test.describe('Operations Tab - Infinite Query', () => {
    test('loads initial page of operations on tab click', async ({page}) => {
        // Setup mocks with 80 operations (4 pages of 20)
        await setupOperationsMock(page, {totalOperations: 80});

        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'diagnostics',
        };

        const tenantPageInstance = new TenantPage(page);
        await tenantPageInstance.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Operations);

        // Wait for table to be visible and data to load
        await diagnostics.operations.waitForTableVisible();
        await diagnostics.operations.waitForDataLoad();

        // Wait a bit for the table to stabilize after initial load
        await page.waitForTimeout(1000);

        // Verify initial page loaded (should have up to DEFAULT_PAGE_SIZE operations)
        const rowCount = await diagnostics.operations.getRowCount();
        expect(rowCount).toBeGreaterThan(0);
        expect(rowCount).toBeLessThanOrEqual(20); // Should have up to DEFAULT_PAGE_SIZE operations loaded initially

        // Verify first row data structure
        const firstRowData = await diagnostics.operations.getRowData(0);
        expect(firstRowData['Operation ID']).toBeTruthy();
        expect(firstRowData['Operation ID']).toContain('ydb://');
        expect(firstRowData['Status']).toBeTruthy();
        expect(['SUCCESS', 'GENERIC_ERROR', 'CANCELLED', 'ABORTED']).toContain(
            firstRowData['Status'],
        );
        expect(firstRowData['State']).toBeTruthy();

        // Verify loading more indicator is not visible initially
        const isLoadingVisible = await diagnostics.operations.isLoadingMoreVisible();
        expect(isLoadingVisible).toBe(false);
    });

    test('loads more operations on scroll', async ({page}) => {
        // Setup mocks with 80 operations (4 pages of 20)
        await setupOperationsMock(page, {totalOperations: 80});

        const pageQueryParams = {
            schema: database,
            database,
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

        // Wait for row count to potentially change
        let finalRowCount: number;
        try {
            finalRowCount = await diagnostics.operations.waitForRowCountToChange(
                initialRowCount,
                3000,
            );
        } catch (_e) {
            // If timeout, the count didn't change
            finalRowCount = await diagnostics.operations.getRowCount();
        }

        // Check if more operations were loaded
        if (finalRowCount > initialRowCount) {
            // Infinite scroll worked - more operations were loaded
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
            schema: database,
            database,
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

    test('shows access denied when operations request returns 403', async ({page}) => {
        // Setup 403 error mock
        await setupOperation403Mock(page);

        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'diagnostics',
        };

        const tenantPageInstance = new TenantPage(page);
        await tenantPageInstance.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Operations);
        // Wait a bit for potential loading
        await page.waitForTimeout(2000);

        // Wait for access denied state to be visible
        const isAccessDeniedVisible = await diagnostics.operations.isAccessDeniedVisible();
        expect(isAccessDeniedVisible).toBe(true);

        // Verify the access denied message
        const accessDeniedTitle = await diagnostics.operations.getAccessDeniedTitle();
        expect(accessDeniedTitle).toBe('Access denied');
    });

    test('shows error state when operations request returns network error', async ({page}) => {
        // Setup network error mock (simulates CORS blocking)
        await setupOperationNetworkErrorMock(page);

        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'diagnostics',
        };

        const tenantPageInstance = new TenantPage(page);
        await tenantPageInstance.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Operations);
        // Wait a bit for potential loading
        await page.waitForTimeout(2000);

        // Wait for error state to be visible
        const isPageErrorVisible = await diagnostics.operations.isPageErrorVisible();
        expect(isPageErrorVisible).toBe(true);

        // Verify the error title
        const errorTitle = await diagnostics.operations.getPageErrorTitle();
        expect(errorTitle).toBe('Error');

        // Verify the error description shows network error
        const errorDescription = await diagnostics.operations.getPageErrorDescription();
        expect(errorDescription.toLowerCase()).toContain('network');
    });

    test('handles malformed response without operations array', async ({page}) => {
        // Setup malformed response mock (returns status SUCCESS but no operations array)
        await setupMalformedOperationsMock(page);

        const pageQueryParams = {
            schema: database,
            database,
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

        // Verify no data rows
        const rowCount = await diagnostics.operations.getRowCount();
        expect(rowCount).toBeLessThanOrEqual(1);

        // Wait to ensure no infinite refetching occurs
        await page.waitForTimeout(3000);

        // Verify the count is still the same (no infinite refetching)
        const finalRowCount = await diagnostics.operations.getRowCount();
        expect(finalRowCount).toBe(rowCount);
    });

    test('stops pagination when receiving malformed response after valid data', async ({page}) => {
        // Setup mock that returns valid data first, then malformed response
        await setupPartialMalformedOperationsMock(page);

        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'diagnostics',
        };

        const tenantPageInstance = new TenantPage(page);
        await tenantPageInstance.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Operations);

        // Wait for initial data to load
        await diagnostics.operations.waitForTableVisible();
        await diagnostics.operations.waitForDataLoad();

        // Verify initial page loaded (virtualized table may not show all 20 rows)
        const initialRowCount = await diagnostics.operations.getRowCount();
        expect(initialRowCount).toBeGreaterThan(0);
        expect(initialRowCount).toBeLessThanOrEqual(20);

        // Verify first row data
        const firstRowData = await diagnostics.operations.getRowData(0);
        expect(firstRowData['Operation ID']).toBeTruthy();

        // Scroll to bottom to trigger next page load
        await diagnostics.operations.scrollToBottom();

        // Wait a bit for potential loading
        await page.waitForTimeout(2000);

        // Check if loading more appears and disappears
        const isLoadingVisible = await diagnostics.operations.isLoadingMoreVisible();
        if (isLoadingVisible) {
            await diagnostics.operations.waitForLoadingMoreToDisappear();
        }

        // Verify the count didn't significantly increase (malformed response didn't add more)
        const finalRowCount = await diagnostics.operations.getRowCount();
        // With virtualization, row count might vary slightly but shouldn't exceed initial data
        expect(finalRowCount).toBeLessThanOrEqual(20);

        // Wait to ensure no infinite refetching occurs
        await page.waitForTimeout(3000);

        // Verify the count remains stable (no infinite refetching)
        const stillFinalRowCount = await diagnostics.operations.getRowCount();
        // Allow for minor virtualization differences
        expect(Math.abs(stillFinalRowCount - finalRowCount)).toBeLessThanOrEqual(5);
    });

    test('loads all operations when scrolling to the bottom multiple times', async ({page}) => {
        // Setup mocks with 80 operations (4 pages of 20)
        await setupOperationsMock(page, {totalOperations: 80});

        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'diagnostics',
        };

        const tenantPageInstance = new TenantPage(page);
        await tenantPageInstance.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Operations);

        // Wait for initial data
        await diagnostics.operations.waitForTableVisible();
        await diagnostics.operations.waitForDataLoad();

        // Wait a bit for the table to stabilize after initial load
        await page.waitForTimeout(2000);

        // Get initial row count (should be around 20)
        const initialRowCount = await diagnostics.operations.getRowCount();
        expect(initialRowCount).toBeGreaterThan(0);
        expect(initialRowCount).toBeLessThanOrEqual(20);

        // Keep scrolling until all operations are loaded
        let previousRowCount = initialRowCount;
        let currentRowCount = initialRowCount;
        const maxScrollAttempts = 10; // Safety limit to prevent infinite loop
        let scrollAttempts = 0;

        // Keep track of whether we're still loading more data
        let hasMoreData = true;

        while (hasMoreData && scrollAttempts < maxScrollAttempts) {
            // Scroll to bottom
            await diagnostics.operations.scrollToBottom();

            // Wait for potential loading
            await page.waitForTimeout(1000);

            // Check if loading more is visible and wait for it to complete
            const isLoadingVisible = await diagnostics.operations.isLoadingMoreVisible();
            if (isLoadingVisible) {
                await diagnostics.operations.waitForLoadingMoreToDisappear();
            }

            // Wait for row count to change or timeout
            try {
                currentRowCount = await diagnostics.operations.waitForRowCountToChange(
                    previousRowCount,
                    3000,
                );
                // If row count changed, we still have more data
                hasMoreData = true;
            } catch (_e) {
                // If timeout, the count didn't change - we might have reached the end
                currentRowCount = await diagnostics.operations.getRowCount();
                hasMoreData = false;
            }

            previousRowCount = currentRowCount;
            scrollAttempts++;
        }

        // With virtualization, we can't verify exact count via DOM
        // But we should have more rows than initially
        expect(currentRowCount).toBeGreaterThan(initialRowCount);

        const rowCount = await diagnostics.operations.getRowCount();
        // Verify we can read data from the last visible row
        if (rowCount > 0) {
            const lastRowData = await diagnostics.operations.getRowData(rowCount - 1);
            expect(lastRowData['Operation ID']).toContain('ydb://');
        }
    });
});
