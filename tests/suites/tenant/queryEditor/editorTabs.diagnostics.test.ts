import {expect, test} from '@playwright/test';

import {database, dsVslotsSchema, dsVslotsTableName} from '../../../utils/constants';
import {NavigationTabs, QueryEditorMode, TenantPage} from '../TenantPage';
import {ObjectSummary} from '../summary/ObjectSummary';
import {RowTableAction} from '../summary/types';

import {
    expectSelectQueryTemplateContentLoaded,
    expectSelectQueryTemplateLoaded,
    gotoDiagnosticsWithMultiTabMode,
    gotoDiagnosticsWithQueryEditorMode,
} from './editorTabs.helpers';
import {QueryEditor} from './models/QueryEditor';

test.describe('Editor tabs from diagnostics', () => {
    test('Select query template fills single-tab editor on cold start from diagnostics', async ({
        page,
    }) => {
        const tenantPage = new TenantPage(page);
        const objectSummary = new ObjectSummary(page);
        const queryEditor = new QueryEditor(page);

        await gotoDiagnosticsWithQueryEditorMode(tenantPage, QueryEditorMode.SingleTab);
        await expect(tenantPage.isDiagnosticsVisible()).resolves.toBe(true);

        await objectSummary.clickActionMenuItem(dsVslotsTableName, RowTableAction.SelectQuery);

        await expectSelectQueryTemplateContentLoaded(queryEditor);
    });

    test('Select query template fills single-tab editor after restoring zero-tabs state', async ({
        page,
    }) => {
        const tenantPage = new TenantPage(page);
        const objectSummary = new ObjectSummary(page);
        const queryEditor = new QueryEditor(page);

        await tenantPage.gotoQueryEditor({
            schema: database,
            database,
            mode: QueryEditorMode.MultiTab,
        });
        await queryEditor.editorTabs.openTabMenu('New Query');
        await queryEditor.editorTabs.clickMenuAction('Close tab');
        await expect(queryEditor.isZeroTabsStateVisible()).resolves.toBe(true);

        await gotoDiagnosticsWithQueryEditorMode(tenantPage, QueryEditorMode.SingleTab);
        await expect(tenantPage.isDiagnosticsVisible()).resolves.toBe(true);

        await objectSummary.clickActionMenuItem(dsVslotsTableName, RowTableAction.SelectQuery);

        await expect(queryEditor.editorTabs.isHidden()).resolves.toBe(true);
        await expect(queryEditor.isZeroTabsStateHidden()).resolves.toBe(true);
        await expectSelectQueryTemplateContentLoaded(queryEditor);
    });

    test('Select query template fills editor on cold start from diagnostics', async ({page}) => {
        const tenantPage = new TenantPage(page);
        const objectSummary = new ObjectSummary(page);
        const queryEditor = new QueryEditor(page);

        await gotoDiagnosticsWithMultiTabMode(tenantPage);
        await expect(tenantPage.isDiagnosticsVisible()).resolves.toBe(true);

        await objectSummary.clickActionMenuItem(dsVslotsTableName, RowTableAction.SelectQuery);

        await expectSelectQueryTemplateLoaded(queryEditor);
    });

    test('Select query template still fills editor after returning from query page', async ({
        page,
    }) => {
        const tenantPage = new TenantPage(page);
        const objectSummary = new ObjectSummary(page);
        const queryEditor = new QueryEditor(page);

        await tenantPage.gotoQueryEditor({
            schema: dsVslotsSchema,
            database,
            mode: QueryEditorMode.MultiTab,
        });
        await queryEditor.waitForEditorReady();

        await tenantPage.selectNavigationTab(NavigationTabs.Diagnostics);
        await expect(tenantPage.isDiagnosticsVisible()).resolves.toBe(true);

        await objectSummary.clickActionMenuItem(dsVslotsTableName, RowTableAction.SelectQuery);

        await expectSelectQueryTemplateLoaded(queryEditor);
    });
});
