import {expect, test} from '@playwright/test';

import {Sidebar} from '../../../sidebar/Sidebar';
import {TenantPage} from '../../TenantPage';
import {ACL_SYNTAX_TEST_CONFIGS, Diagnostics, DiagnosticsTab} from '../Diagnostics';

const newSubject = 'foo';

test.describe('Diagnostics Access tab', async () => {
    test('Access tab shows owner card', async ({page}) => {
        const pageQueryParams = {
            schema: '/local',
            database: '/local',
            tenantPage: 'diagnostics',
            diagnosticsTab: 'access',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);

        // Verify owner card is visible
        await expect(diagnostics.isOwnerCardVisible()).resolves.toBe(true);
    });

    test('Can change owner on access tab', async ({page}) => {
        const pageQueryParams = {
            schema: '/local',
            database: '/local',
            tenantPage: 'diagnostics',
            diagnosticsTab: 'access',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);

        // Get the current owner name
        const initialOwnerName = await diagnostics.getOwnerName();

        // Change the owner to "John Dow"
        const newOwnerName = initialOwnerName + 'new';
        await diagnostics.changeOwner(newOwnerName);

        // Verify the owner has been changed
        const updatedOwnerName = await diagnostics.getOwnerName();
        expect(updatedOwnerName).toBe(newOwnerName);
    });

    test('Owner card is visible after navigating to access tab', async ({page}) => {
        const pageQueryParams = {
            schema: '/local',
            database: '/local',
            tenantPage: 'diagnostics',
            diagnosticsTab: 'access',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);

        // Navigate to the Access tab
        await diagnostics.clickTab(DiagnosticsTab.Access);

        // Verify owner card is visible
        await expect(diagnostics.isOwnerCardVisible()).resolves.toBe(true);
    });

    test('Grant Access button opens grant access drawer', async ({page}) => {
        const pageQueryParams = {
            schema: '/local',
            database: '/local',
            tenantPage: 'diagnostics',
            diagnosticsTab: 'access',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);

        // Click on the Grant Access button
        await diagnostics.clickGrantAccessButton();

        await expect(diagnostics.isGrantAccessDrawerVisible()).resolves.toBe(true);
    });

    test('Can grant full access to a new subject', async ({page}) => {
        const pageQueryParams = {
            schema: '/local',
            database: '/local',
            tenantPage: 'diagnostics',
            diagnosticsTab: 'access',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);

        // Verify that the rights wrapper is not visible initially
        await expect(diagnostics.isRightsWrapperVisible()).resolves.toBe(false);

        // Click on the Grant Access button
        await diagnostics.clickGrantAccessButton();

        // Verify that the grant access dialog appears
        await expect(diagnostics.isGrantAccessDrawerVisible()).resolves.toBe(true);

        // Enter "foo" in the subject input and press Enter
        await diagnostics.enterSubjectInGrantAccessDialog(newSubject);

        // Verify that the rights wrapper appears
        await expect(diagnostics.isRightsWrapperVisible()).resolves.toBe(true);

        // Verify that the Apply button is disabled initially
        await expect(diagnostics.isApplyButtonDisabled()).resolves.toBe(true);

        // Click on the switch for the "full" access right
        await diagnostics.clickFullAccessSwitch();

        // Verify that the Apply button is now enabled
        await expect(diagnostics.isApplyButtonDisabled()).resolves.toBe(false);

        // Click the Apply button
        await diagnostics.clickApplyButton();

        // Verify that "foo" appears in the rights table
        await expect(diagnostics.isSubjectInRightsTable(newSubject)).resolves.toBe(true);
    });

    test('Effective rights display changes when switching ACL syntax', async ({page}) => {
        const pageQueryParams = {
            schema: '/local',
            database: '/local',
            tenantPage: 'diagnostics',
            diagnosticsTab: 'access',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        const sidebar = new Sidebar(page);

        // Run tests for each syntax configuration
        const results: Record<string, Record<string, string>> = {};

        for (const config of ACL_SYNTAX_TEST_CONFIGS) {
            const rights = await diagnostics.switchAclSyntaxAndGetRights(sidebar, config.syntax);
            expect(rights).toBeTruthy();

            // Verify expected patterns
            for (const [subject, pattern] of Object.entries(config.patterns)) {
                expect(rights[subject]).toContain(pattern);
            }

            results[config.syntax] = rights;
        }

        // Verify that permission formats are different between syntaxes
        expect(results.YQL?.['USERS']).not.toEqual(results.KiKiMr?.['USERS']);
        expect(results.KiKiMr?.['USERS']).not.toEqual(results['YDB Short']?.['USERS']);
        expect(results.YQL?.['DATA-READERS']).not.toEqual(results['YDB Short']?.['DATA-READERS']);
    });
});
