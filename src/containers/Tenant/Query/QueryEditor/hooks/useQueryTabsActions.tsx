import React from 'react';

import {v4 as uuidv4} from 'uuid';

import {
    addQueryTab,
    closeQueryTab,
    renameQueryTab,
    selectActiveTabId,
    selectTabsById,
    selectTabsOrder,
    setActiveQueryTab,
} from '../../../../../store/reducers/query/query';
import {useTypedDispatch, useTypedSelector} from '../../../../../utils/hooks';
import i18n from '../../i18n';
import {queryExecutionManagerInstance} from '../utils/queryExecutionManager';

export function useQueryTabsActions() {
    const dispatch = useTypedDispatch();
    const activeTabId = useTypedSelector(selectActiveTabId);
    const tabsOrder = useTypedSelector(selectTabsOrder);
    const tabsById = useTypedSelector(selectTabsById);

    const handleTabSwitch = React.useCallback(
        (tabId: string) => {
            dispatch(setActiveQueryTab({tabId}));
        },
        [dispatch],
    );

    const handleActivateTab = handleTabSwitch;

    const handleCloseTab = React.useCallback(
        (tabId: string) => {
            queryExecutionManagerInstance.abortQuery(tabId);
            dispatch(closeQueryTab({tabId}));
        },
        [dispatch],
    );

    const handleCloseActiveTab = React.useCallback(() => {
        handleCloseTab(activeTabId);
    }, [activeTabId, handleCloseTab]);

    const handleCloseOtherTabs = React.useCallback(
        (baseTabId: string) => {
            tabsOrder.filter((tabId) => tabId !== baseTabId).forEach(handleCloseTab);
        },
        [handleCloseTab, tabsOrder],
    );

    const handleCloseAllTabs = React.useCallback(() => {
        tabsOrder.forEach(handleCloseTab);
    }, [handleCloseTab, tabsOrder]);

    const handleDuplicateTab = React.useCallback(
        (baseTabId: string) => {
            const tab = tabsById[baseTabId];
            if (!tab) {
                return;
            }

            const baseTitle = tab.title || i18n('editor-tabs.untitled');
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
        const nextIndex = tabsOrder.length + 1;
        dispatch(
            addQueryTab({
                tabId,
                title: i18n('editor-tabs.default-title', {index: nextIndex}),
            }),
        );
    }, [dispatch, tabsOrder.length]);

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
