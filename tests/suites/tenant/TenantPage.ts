import type {Locator, Page} from '@playwright/test';

import {PageModel} from '../../models/PageModel';
import {databasePage} from '../../utils/constants';

import {QueryEditor, QueryTabs} from './queryEditor/models/QueryEditor';
import {SaveQueryDialog} from './queryEditor/models/SaveQueryDialog';
import {UnsavedChangesModal} from './queryEditor/models/UnsavedChangesModal';
import {SavedQueriesTable} from './savedQueries/models/SavedQueriesTable';

export const VISIBILITY_TIMEOUT = 10 * 1000;

export enum NavigationTabs {
    Query = 'Query',
    Diagnostics = 'Diagnostics',
}

export enum QueryEditorMode {
    SingleTab = 'single-tab',
    MultiTab = 'multi-tab',
}

export class TenantPage extends PageModel {
    queryEditor: QueryEditor;
    saveQueryDialog: SaveQueryDialog;
    savedQueriesTable: SavedQueriesTable;
    unsavedChangesModal: UnsavedChangesModal;

    private navigation: Locator;
    private radioGroup: Locator;
    private diagnosticsContainer: Locator;
    private emptyState: Locator;
    private emptyStateTitle: Locator;

    constructor(page: Page) {
        super(page, databasePage);

        this.navigation = page.locator('.ydb-tenant-navigation');
        this.radioGroup = this.navigation.locator('.g-segmented-radio-group');
        this.diagnosticsContainer = page.locator('.kv-tenant-diagnostics');
        this.emptyState = page.locator('.empty-state');
        this.emptyStateTitle = this.emptyState.locator('.empty-state__title');

        this.queryEditor = new QueryEditor(page);
        this.saveQueryDialog = new SaveQueryDialog(page);
        this.savedQueriesTable = new SavedQueriesTable(page);
        this.unsavedChangesModal = new UnsavedChangesModal(page);
    }

    async isDiagnosticsVisible() {
        await this.diagnosticsContainer.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isEmptyStateVisible() {
        await this.emptyState.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async getEmptyStateTitle(): Promise<string> {
        return this.emptyStateTitle.innerText();
    }

    async selectNavigationTab(tabName: NavigationTabs) {
        const tabInput = this.radioGroup.locator(`input[value="${tabName.toLowerCase()}"]`);
        await tabInput.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await tabInput.click();
    }

    async gotoQueryEditor({
        schema,
        database,
        mode,
    }: {
        schema: string;
        database: string;
        mode?: QueryEditorMode;
    }) {
        await this.page.addInitScript(
            ({nextMode}) => {
                if (nextMode) {
                    window.e2eQueryEditorMode = nextMode;
                } else {
                    delete window.e2eQueryEditorMode;
                }
            },
            {nextMode: mode},
        );

        return this.goto({
            schema,
            database,
            databasePage: 'query',
        });
    }

    async saveQuery(queryText: string, name?: string): Promise<string> {
        const queryName = name || `Query ${Date.now()}`;
        await this.queryEditor.setQuery(queryText);

        if (await this.queryEditor.isSaveButtonVisible(1000)) {
            await this.queryEditor.clickSaveButton();
        } else if (await this.queryEditor.isEditButtonVisible(1000)) {
            await this.queryEditor.clickEditButton();
            await this.queryEditor.clickSaveAsNewEditButton();
        } else {
            throw new Error('Neither Save nor Edit query button is available');
        }

        await this.saveQueryDialog.setQueryName(queryName);
        await this.saveQueryDialog.clickSave();
        return queryName;
    }

    async editAsNewQuery(queryText: string, name?: string): Promise<string> {
        const queryName = name || `Query ${Date.now()}`;
        await this.queryEditor.setQuery(queryText);
        await this.queryEditor.clickEditButton();
        await this.queryEditor.clickSaveAsNewEditButton();
        await this.saveQueryDialog.setQueryName(queryName);
        await this.saveQueryDialog.clickSave();
        return queryName;
    }

    async openSavedQuery(queryName: string): Promise<void> {
        // Wait before switching to saved query tabs
        // https://github.com/microsoft/monaco-editor/issues/4702
        await this.page.waitForTimeout(500);
        await this.queryEditor.queryTabs.selectTab(QueryTabs.Saved);
        await this.savedQueriesTable.isVisible();
        await this.savedQueriesTable.selectQuery(queryName);
    }

    async isUnsavedChangesModalVisible(): Promise<boolean> {
        try {
            return await this.unsavedChangesModal.isVisible();
        } catch {
            return false;
        }
    }

    async isUnsavedChangesModalHidden(): Promise<boolean> {
        try {
            return await this.unsavedChangesModal.isHidden();
        } catch {
            return false;
        }
    }
}
