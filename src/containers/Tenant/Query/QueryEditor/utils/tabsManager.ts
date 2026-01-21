import type Monaco from 'monaco-editor';

import {YQL_LANGUAGE_ID} from '../../../../../utils/monaco/constats';

type MonacoApi = typeof Monaco;

export class TabsManager {
    private readonly modelsByTabId = new Map<string, Monaco.editor.ITextModel>();
    private readonly viewStatesByTabId = new Map<
        string,
        Monaco.editor.ICodeEditorViewState | null
    >();
    private activeTabId: string | null = null;

    setActiveTabModel(params: {
        tabId: string;
        nextValue: string;
        editor: Monaco.editor.IStandaloneCodeEditor;
        monaco: MonacoApi;
    }) {
        const {tabId, nextValue, editor, monaco} = params;

        const prevTabId = this.activeTabId;
        const isTabSwitch = Boolean(prevTabId && prevTabId !== tabId);
        if (isTabSwitch && prevTabId) {
            this.viewStatesByTabId.set(prevTabId, editor.saveViewState());
        }

        const model = this.getOrCreateModel(tabId, nextValue, monaco);
        if (model.getValue() !== nextValue) {
            model.setValue(nextValue);
        }

        const isModelSwitch = editor.getModel() !== model;
        if (isModelSwitch) {
            editor.setModel(model);
        }

        // Restore view state only when actually switching tabs/models.
        // Restoring on each `nextValue` update causes cursor jumps while typing.
        if (isTabSwitch || isModelSwitch) {
            const viewState = this.viewStatesByTabId.get(tabId);
            if (viewState) {
                editor.restoreViewState(viewState);
            }
        }

        this.activeTabId = tabId;
        if (isTabSwitch || isModelSwitch) {
            editor.focus();
        }
    }

    disposeRemovedTabs(tabsOrder: readonly string[]) {
        const tabsSet = new Set(tabsOrder);

        for (const tabId of this.modelsByTabId.keys()) {
            if (tabsSet.has(tabId)) {
                continue;
            }

            const model = this.modelsByTabId.get(tabId);
            if (model) {
                model.dispose();
            }
            this.modelsByTabId.delete(tabId);
            this.viewStatesByTabId.delete(tabId);

            if (this.activeTabId === tabId) {
                this.activeTabId = null;
            }
        }
    }

    disposeAll() {
        for (const model of this.modelsByTabId.values()) {
            model.dispose();
        }
        this.modelsByTabId.clear();
        this.viewStatesByTabId.clear();
        this.activeTabId = null;
    }

    private getOrCreateModel(tabId: string, initialValue: string, monaco: MonacoApi) {
        const existingModel = this.modelsByTabId.get(tabId);
        if (existingModel && !existingModel.isDisposed()) {
            return existingModel;
        }

        const model = monaco.editor.createModel(initialValue, YQL_LANGUAGE_ID);
        this.modelsByTabId.set(tabId, model);
        return model;
    }
}
