import React from 'react';

import {v4 as uuidv4} from 'uuid';

import {
    addQueryTab,
    closeQueryTab,
    renameQueryTab,
    selectActiveTabId,
    selectNewTabCounter,
    selectTabsById,
    selectTabsOrder,
    setActiveQueryTab,
} from '../../../../../store/reducers/query/query';
import {useTypedDispatch, useTypedSelector} from '../../../../../utils/hooks';
import {getConfirmation} from '../../../../../utils/hooks/withConfirmation/useChangeInputWithConfirmation';
import i18n from '../../i18n';
import {queryExecutionManagerInstance} from '../utils/queryExecutionManager';

function getNewQueryTitle(counter: number): string {
    if (counter === 0) {
        return i18n('editor-tabs.default-title');
    }
    return i18n('editor-tabs.default-title-indexed', {index: counter});
}

export function useQueryTabsActions() {
    const dispatch = useTypedDispatch();
    const activeTabId = useTypedSelector(selectActiveTabId);
    const tabsOrder = useTypedSelector(selectTabsOrder);
    const tabsById = useTypedSelector(selectTabsById);
    const newTabCounter = useTypedSelector(selectNewTabCounter);

    const handleTabSwitch = React.useCallback(
        (tabId: string) => {
            dispatch(setActiveQueryTab({tabId}));
        },
        [dispatch],
    );

    const handleActivateTab = handleTabSwitch;

    const closeTabImmediate = React.useCallback(
        (tabId: string) => {
            queryExecutionManagerInstance.abortQuery(tabId);
            dispatch(closeQueryTab({tabId}));
        },
        [dispatch],
    );

    const handleCloseTab = React.useCallback(
        async (tabId: string) => {
            const tab = tabsById[tabId];
            if (tab?.isDirty) {
                const confirmed = await getConfirmation();
                if (!confirmed) {
                    return;
                }
            }
            closeTabImmediate(tabId);
        },
        [closeTabImmediate, tabsById],
    );

    const handleCloseActiveTab = React.useCallback(() => {
        handleCloseTab(activeTabId);
    }, [activeTabId, handleCloseTab]);

    const handleCloseOtherTabs = React.useCallback(
        async (baseTabId: string) => {
            const tabsToClose = tabsOrder.filter((tabId) => tabId !== baseTabId);
            const hasDirtyTabs = tabsToClose.some((tabId) => tabsById[tabId]?.isDirty);
            if (hasDirtyTabs) {
                const confirmed = await getConfirmation();
                if (!confirmed) {
                    return;
                }
            }
            tabsToClose.forEach(closeTabImmediate);
        },
        [closeTabImmediate, tabsById, tabsOrder],
    );

    const handleCloseAllTabs = React.useCallback(async () => {
        const hasDirtyTabs = tabsOrder.some((tabId) => tabsById[tabId]?.isDirty);
        if (hasDirtyTabs) {
            const confirmed = await getConfirmation();
            if (!confirmed) {
                return;
            }
        }
        tabsOrder.forEach(closeTabImmediate);
    }, [closeTabImmediate, tabsById, tabsOrder]);

    const handleDuplicateTab = React.useCallback(
        (baseTabId: string) => {
            const tab = tabsById[baseTabId];
            if (!tab) {
                return;
            }

            const baseTitle = tab.title || i18n('editor-tabs.default-title');
            const tabId = uuidv4();
            dispatch(
                addQueryTab({
                    tabId,
                    title: i18n('editor-tabs.duplicate-title', {title: baseTitle}),
                    input: tab.input,
                    makeActive: true,
                }),
            );
        },
        [dispatch, tabsById],
    );

    const handleRenameTab = React.useCallback(
        (tabId: string, title: string) => {
            dispatch(renameQueryTab({tabId, title}));
        },
        [dispatch],
    );

    const handleNewTabClick = React.useCallback(() => {
        const tabId = uuidv4();
        dispatch(
            addQueryTab({
                tabId,
                title: getNewQueryTitle(newTabCounter),
                newTabCounter: newTabCounter + 1,
            }),
        );
    }, [dispatch, newTabCounter]);

    const activateAdjacentTab = React.useCallback(
        (direction: -1 | 1) => {
            if (!tabsOrder.length || tabsOrder.length === 1) {
                return;
            }

            const currentIndex = tabsOrder.indexOf(activeTabId);
            if (currentIndex === -1) {
                handleTabSwitch(tabsOrder[0]);
                return;
            }

            const nextIndex = (currentIndex + direction + tabsOrder.length) % tabsOrder.length;
            handleTabSwitch(tabsOrder[nextIndex]);
        },
        [activeTabId, handleTabSwitch, tabsOrder],
    );

    const handleNextTab = React.useCallback(() => {
        activateAdjacentTab(1);
    }, [activateAdjacentTab]);

    const handlePreviousTab = React.useCallback(() => {
        activateAdjacentTab(-1);
    }, [activateAdjacentTab]);

    return {
        activeTabId,
        tabsOrder,
        tabsById,
        handleTabSwitch,
        handleActivateTab,
        handleNewTabClick,
        handleCloseTab,
        handleCloseActiveTab,
        handleCloseOtherTabs,
        handleCloseAllTabs,
        handleDuplicateTab,
        handleRenameTab,
        handleNextTab,
        handlePreviousTab,
    };
}
