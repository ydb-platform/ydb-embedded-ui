import {expect} from '@playwright/test';
import type {Page} from '@playwright/test';

import {database, dsVslotsSchema} from '../../../utils/constants';
import {QueryEditorMode, TenantPage} from '../TenantPage';

import type {QueryEditor} from './models/QueryEditor';

export async function setupMultiTabQueryEditor(page: Page) {
    const tenantPage = new TenantPage(page);
    await tenantPage.gotoQueryEditor({
        schema: database,
        database,
        mode: QueryEditorMode.MultiTab,
    });

    return {tenantPage, queryEditor: tenantPage.queryEditor};
}

export async function gotoDiagnosticsWithQueryEditorMode(
    tenantPage: TenantPage,
    mode: QueryEditorMode,
) {
    await tenantPage.page.addInitScript(
        ({nextMode}) => {
            if (nextMode) {
                window.e2eQueryEditorMode = nextMode;
            } else {
                delete window.e2eQueryEditorMode;
            }
        },
        {nextMode: mode},
    );

    await tenantPage.goto({
        schema: dsVslotsSchema,
        database,
        databasePage: 'diagnostics',
    });
}

export async function gotoDiagnosticsWithMultiTabMode(tenantPage: TenantPage) {
    await gotoDiagnosticsWithQueryEditorMode(tenantPage, QueryEditorMode.MultiTab);
}

export async function expectSelectQueryTemplateContentLoaded(queryEditor: QueryEditor) {
    const expectedTablePath = dsVslotsSchema.replace(database + '/', '');

    await expect
        .poll(() => queryEditor.getEditorContent(), {timeout: 5000})
        .toContain('FROM `' + expectedTablePath + '`');

    const editorContent = await queryEditor.getEditorContent();
    expect(editorContent).toContain('SELECT');
    expect(editorContent).toContain('LIMIT');
}

export async function expectSelectQueryTemplateLoaded(queryEditor: QueryEditor) {
    await expect(queryEditor.editorTabs.isVisible()).resolves.toBe(true);
    await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('Select query');
    await expectSelectQueryTemplateContentLoaded(queryEditor);
}
