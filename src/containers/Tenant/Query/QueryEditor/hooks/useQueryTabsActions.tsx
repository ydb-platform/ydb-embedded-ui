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
import {queryManagerInstance} from '../utils/queryManager';

export function useQueryTabsActions() {
    const dispatch = useTypedDispatch();
    const activeTabId = useTypedSelector(selectActiveTabId);
    const tabsOrder = useTypedSelector(selectTabsOrder);
    const tabsById = useTypedSelector(selectTabsById);
    const activeTab = tabsById[activeTabId];

    const handleTabSwitch = React.useCallback(
        (tabId: string) => {
            dispatch(setActiveQueryTab({tabId}));
        },
        [dispatch],
    );

    const closeTab = React.useCallback(
        (tabId: string) => {
            queryManagerInstance.abortQuery(tabId);
            dispatch(closeQueryTab({tabId}));
        },
        [dispatch],
    );

    const handleCloseActiveTab = React.useCallback(() => {
        closeTab(activeTabId);
    }, [activeTabId, closeTab]);

    const handleDuplicateActiveTab = React.useCallback(() => {
        if (!activeTab) {
            return;
        }

        const tabId = uuidv4();
        dispatch(
            addQueryTab({
                tabId,
                title: i18n('editor-tabs.duplicate-title', {title: activeTab.title}),
                input: activeTab.input,
            }),
        );
    }, [activeTab, dispatch]);

    const handleRenameActiveTab = React.useCallback(
        (title: string) => {
            dispatch(renameQueryTab({tabId: activeTabId, title}));
        },
        [activeTabId, dispatch],
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
        handleNewTabClick,
        handleCloseActiveTab,
        handleDuplicateActiveTab,
        handleRenameActiveTab,
        handleNextTab,
        handlePreviousTab,
    };
}
