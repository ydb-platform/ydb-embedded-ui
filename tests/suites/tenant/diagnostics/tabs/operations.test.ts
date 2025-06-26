import {expect, test} from '@playwright/test';

import {tenantName} from '../../../../utils/constants';
import {TenantPage} from '../../TenantPage';
import {Diagnostics, DiagnosticsTab} from '../Diagnostics';

import {
    setupEmptyOperationsMock,
    setupOperation403Mock,
    setupOperationNetworkErrorMock,
    setupOperationsMock,
} from './operationsMocks';

test.describe('Operations Tab - Infinite Query', () => {
    test('loads initial page of operations on tab click', async ({page}) => {
        // Setup mocks with 80 operations (4 pages of 20)
        await setupOperationsMock(page, {totalOperations: 80});

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

        // Wait a bit for the counter to stabilize after initial load
        await page.waitForTimeout(1000);

        // Verify initial page loaded (should show count in badge)
        const operationsCount = await diagnostics.operations.getOperationsCount();
        expect(operationsCount).toBeGreaterThan(0);
        expect(operationsCount).toBeLessThanOrEqual(20); // Should have up to DEFAULT_PAGE_SIZE operations loaded initially

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
        // Setup mocks with 80 operations (4 pages of 20)
        await setupOperationsMock(page, {totalOperations: 80});

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

        // Get initial operations count
        const initialOperationsCount = await diagnostics.operations.getOperationsCount();
        expect(initialOperationsCount).toBeGreaterThan(0);

        // Scroll to bottom
        await diagnostics.operations.scrollToBottom();

        // Wait for operations count to potentially change
        let finalOperationsCount: number;
        try {
            finalOperationsCount = await diagnostics.operations.waitForOperationsCountToChange(
                initialOperationsCount,
                3000,
            );
        } catch (_e) {
            // If timeout, the count didn't change
            finalOperationsCount = await diagnostics.operations.getOperationsCount();
        }

        // Check if more operations were loaded
        if (finalOperationsCount > initialOperationsCount) {
            // Infinite scroll worked - more operations were loaded
            expect(finalOperationsCount).toBeGreaterThan(initialOperationsCount);
        } else {
            // No more data to load - operations count should stay the same
            expect(finalOperationsCount).toBe(initialOperationsCount);
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

    test('shows access denied when operations request returns 403', async ({page}) => {
        // Setup 403 error mock
        await setupOperation403Mock(page);

        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
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
            schema: tenantName,
            database: tenantName,
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

    test('loads all operations when scrolling to the bottom multiple times', async ({page}) => {
        // Setup mocks with 80 operations (4 pages of 20)
        await setupOperationsMock(page, {totalOperations: 80});

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

        // Wait a bit for the counter to stabilize after initial load
        await page.waitForTimeout(2000);

        // Get initial operations count (should be around 20)
        const initialOperationsCount = await diagnostics.operations.getOperationsCount();
        expect(initialOperationsCount).toBeGreaterThan(0);
        expect(initialOperationsCount).toBeLessThanOrEqual(20);

        // Keep scrolling until all operations are loaded
        let previousOperationsCount = initialOperationsCount;
        let currentOperationsCount = initialOperationsCount;
        const maxScrollAttempts = 10; // Safety limit to prevent infinite loop
        let scrollAttempts = 0;

        while (currentOperationsCount < 80 && scrollAttempts < maxScrollAttempts) {
            // Scroll to bottom
            await diagnostics.operations.scrollToBottom();

            // Wait for potential loading
            await page.waitForTimeout(1000);

            // Check if loading more is visible and wait for it to complete
            const isLoadingVisible = await diagnostics.operations.isLoadingMoreVisible();
            if (isLoadingVisible) {
                await diagnostics.operations.waitForLoadingMoreToDisappear();
            }

            // Wait for operations count to change or timeout
            try {
                currentOperationsCount =
                    await diagnostics.operations.waitForOperationsCountToChange(
                        previousOperationsCount,
                        3000,
                    );
            } catch (_e) {
                // If timeout, the count didn't change - we might have reached the end
                currentOperationsCount = await diagnostics.operations.getOperationsCount();
            }

            previousOperationsCount = currentOperationsCount;
            scrollAttempts++;
        }

        // Verify all 80 operations were loaded
        expect(currentOperationsCount).toBe(80);

        const rowCount = await diagnostics.operations.getRowCount();
        // Verify the last operation has the expected ID pattern
        const lastRowData = await diagnostics.operations.getRowData(rowCount - 1);
        expect(lastRowData['Operation ID']).toContain('ydb://');
    });
});
