import {expect, test} from '@playwright/test';

import {wait} from '../../../../src/utils';
import {getClipboardContent} from '../../../utils/clipboard';
import {
    backend,
    dsStoragePoolsTableName,
    dsVslotsSchema,
    dsVslotsTableName,
    tenantName,
} from '../../../utils/constants';
import {TenantPage} from '../TenantPage';
import {QueryEditor} from '../queryEditor/models/QueryEditor';
import {UnsavedChangesModal} from '../queryEditor/models/UnsavedChangesModal';

import {ObjectSummary, ObjectSummaryTab} from './ObjectSummary';
import {RowTableAction} from './types';

test.describe('Object Summary', async () => {
    test.beforeEach(async ({page}) => {
        const pageQueryParams = {
            schema: dsVslotsSchema,
            database: tenantName,
            general: 'query',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);
    });

    test('Open Preview icon appears on hover for "dv_slots" tree item', async ({page}) => {
        const objectSummary = new ObjectSummary(page);
        await expect(objectSummary.isTreeVisible()).resolves.toBe(true);

        const isPreviewIconVisible =
            await objectSummary.isOpenPreviewIconVisibleOnHover(dsVslotsTableName);
        expect(isPreviewIconVisible).toBe(true);
    });

    test('On Open Preview icon click table with results appear', async ({page}) => {
        const objectSummary = new ObjectSummary(page);
        const queryEditor = new QueryEditor(page);

        await expect(objectSummary.isTreeVisible()).resolves.toBe(true);
        await expect(queryEditor.resultTable.isHidden()).resolves.toBe(true);

        await objectSummary.clickPreviewButton(dsVslotsTableName);
        await expect(queryEditor.resultTable.isPreviewVisible()).resolves.toBe(true);
    });

    test('Preview table is still present after settings dialog was opened', async ({page}) => {
        const objectSummary = new ObjectSummary(page);
        const queryEditor = new QueryEditor(page);

        await objectSummary.clickPreviewButton(dsVslotsTableName);
        await queryEditor.clickGearButton();
        await queryEditor.closeSettingsDialog();

        await expect(queryEditor.resultTable.isPreviewVisible()).resolves.toBe(true);
    });

    test('Primary keys header is visible in Schema tab', async ({page}) => {
        const objectSummary = new ObjectSummary(page);

        await objectSummary.clickTab(ObjectSummaryTab.Schema);
        await expect(objectSummary.isSchemaViewerVisible()).resolves.toBe(true);

        await expect(objectSummary.getPrimaryKeys()).resolves.toEqual([
            'NodeId',
            'PDiskId',
            'VSlotId',
        ]);
    });

    test('Actions dropdown menu opens and contains expected items', async ({page}) => {
        const objectSummary = new ObjectSummary(page);
        await expect(objectSummary.isTreeVisible()).resolves.toBe(true);

        await objectSummary.clickActionsButton(dsVslotsTableName);
        await expect(objectSummary.isActionsMenuVisible()).resolves.toBe(true);
    });

    test('Can click menu items in actions dropdown', async ({page}) => {
        const objectSummary = new ObjectSummary(page);
        const queryEditor = new QueryEditor(page);

        await expect(objectSummary.isTreeVisible()).resolves.toBe(true);
        await objectSummary.clickActionMenuItem(dsVslotsTableName, RowTableAction.AddIndex);
        await page.waitForTimeout(500);

        await expect(queryEditor.editorTextArea).toBeVisible();
        await expect(queryEditor.editorTextArea).not.toBeEmpty();
    });

    test('Select and Upsert actions show loading state', async ({page}) => {
        await page.route(`${backend}/viewer/json/describe?*`, async (route) => {
            await wait(1000);
            await route.continue();
        });

        const objectSummary = new ObjectSummary(page);
        await expect(objectSummary.isTreeVisible()).resolves.toBe(true);

        // Open actions menu
        await objectSummary.clickActionsButton(dsStoragePoolsTableName);
        await expect(objectSummary.isActionsMenuVisible()).resolves.toBe(true);

        // Verify loading states
        await expect(objectSummary.isActionItemLoading(RowTableAction.SelectQuery)).resolves.toBe(
            true,
        );
        await expect(objectSummary.isActionItemLoading(RowTableAction.UpsertQuery)).resolves.toBe(
            true,
        );
    });

    test('Monaco editor shows column list after select query loading completes', async ({page}) => {
        const objectSummary = new ObjectSummary(page);
        const queryEditor = new QueryEditor(page);

        await objectSummary.clickActionMenuItem(dsVslotsTableName, RowTableAction.SelectQuery);

        const selectContent = await queryEditor.editorTextArea.inputValue();
        expect(selectContent).toContain('SELECT');
        expect(selectContent).toContain('FROM');
        expect(selectContent).toMatch(/`\w+`,\s*`\w+`/); // At least two backticked columns
    });

    test('Monaco editor shows column list after upsert query loading completes', async ({page}) => {
        const objectSummary = new ObjectSummary(page);
        const queryEditor = new QueryEditor(page);

        await objectSummary.clickActionMenuItem(dsVslotsTableName, RowTableAction.UpsertQuery);

        const upsertContent = await queryEditor.editorTextArea.inputValue();
        expect(upsertContent).toContain('UPSERT INTO');
        expect(upsertContent).toContain('VALUES');
        expect(upsertContent).toMatch(/\(\s*`\w+`\s*(,\s*`\w+`\s*)*\)/); // Backticked columns in parentheses
    });

    test('Different tables show different column lists in Monaco editor', async ({page}) => {
        const objectSummary = new ObjectSummary(page);
        const queryEditor = new QueryEditor(page);
        const unsavedChangesModal = new UnsavedChangesModal(page);

        // Get columns for first table
        await objectSummary.clickActionMenuItem(dsVslotsTableName, RowTableAction.SelectQuery);
        const vslotsColumns = await queryEditor.editorTextArea.inputValue();

        // Get columns for second table
        await objectSummary.clickActionMenuItem(
            dsStoragePoolsTableName,
            RowTableAction.SelectQuery,
        );

        await page.waitForTimeout(500);
        // Click Don't save in the modal
        await unsavedChangesModal.clickDontSave();

        const storagePoolsColumns = await queryEditor.editorTextArea.inputValue();

        // Verify the column lists are different
        expect(vslotsColumns).not.toEqual(storagePoolsColumns);
    });

    test('ACL tab shows correct access rights', async ({page}) => {
        const pageQueryParams = {
            schema: '/local/.sys_health',
            database: '/local',
            summaryTab: 'acl',
            tenantPage: 'query',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const objectSummary = new ObjectSummary(page);
        await objectSummary.waitForAclVisible();

        // Check Access Rights
        const accessRights = await objectSummary.getAccessRights();
        expect(accessRights).toEqual([{user: 'root@builtin', rights: 'Owner'}]);

        // Check Effective Access Rights
        const effectiveRights = await objectSummary.getEffectiveAccessRights();
        expect(effectiveRights).toEqual([
            {group: 'USERS', permissions: ['ConnectDatabase']},
            {group: 'METADATA-READERS', permissions: ['List']},
            {group: 'DATA-READERS', permissions: ['SelectRow']},
            {group: 'DATA-WRITERS', permissions: ['UpdateRow', 'EraseRow']},
            {
                group: 'DDL-ADMINS',
                permissions: [
                    'WriteAttributes',
                    'CreateDirectory',
                    'CreateTable',
                    'RemoveSchema',
                    'AlterSchema',
                ],
            },
            {group: 'ACCESS-ADMINS', permissions: ['GrantAccessRights']},
            {group: 'DATABASE-ADMINS', permissions: ['Manage']},
        ]);
    });

    test('Copy path copies correct path to clipboard', async ({page}) => {
        const pageQueryParams = {
            schema: dsVslotsSchema,
            database: tenantName,
            general: 'query',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const objectSummary = new ObjectSummary(page);
        await objectSummary.clickActionMenuItem(dsVslotsTableName, RowTableAction.CopyPath);

        await page.waitForTimeout(100);

        const clipboardContent = await getClipboardContent(page);
        expect(clipboardContent).toBe('.sys/ds_vslots');
    });
});
