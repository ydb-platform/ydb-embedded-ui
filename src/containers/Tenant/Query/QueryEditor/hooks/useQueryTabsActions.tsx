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
import {reachMetricaGoal} from '../../../../../utils/yaMetrica';
import i18n from '../../i18n';
import {queryExecutionManagerInstance} from '../utils/queryExecutionManager';

/**
 * Yields to the event loop before dispatching active tab change.
 * This lets pending browser events from DropdownMenu (close, focus restoration)
 * settle before we switch tabs to show the confirmation dialog.
 */
async function activateTabAndWait(
    dispatch: ReturnType<typeof useTypedDispatch>,
    tabId: string,
): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    dispatch(setActiveQueryTab({tabId}));
}

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
            reachMetricaGoal('closeQueryTab', {type: 'single', tabsCount: tabsOrder.length});
            closeTabImmediate(tabId);
        },
        [closeTabImmediate, tabsById, tabsOrder.length],
    );

    const handleCloseActiveTab = React.useCallback(() => {
        handleCloseTab(activeTabId);
    }, [activeTabId, handleCloseTab]);

    const handleCloseOtherTabs = React.useCallback(
        async (baseTabId: string) => {
            const tabsToClose = tabsOrder.filter((tabId) => tabId !== baseTabId);
            const dirtyTabIds = tabsToClose.filter((id) => tabsById[id]?.isDirty);
            const cleanTabIds = tabsToClose.filter((id) => !tabsById[id]?.isDirty);

            cleanTabIds.forEach(closeTabImmediate);

            for (const tabId of dirtyTabIds) {
                const tab = tabsById[tabId];
                await activateTabAndWait(dispatch, tabId);
                const confirmed = await getConfirmation(tab?.title);
                if (!confirmed) {
                    break;
                }
                closeTabImmediate(tabId);
            }

            reachMetricaGoal('closeQueryTab', {type: 'other', tabsCount: tabsOrder.length});
        },
        [closeTabImmediate, dispatch, tabsById, tabsOrder],
    );

    const handleCloseAllTabs = React.useCallback(async () => {
        const dirtyTabIds = tabsOrder.filter((id) => tabsById[id]?.isDirty);
        const cleanTabIds = tabsOrder.filter((id) => !tabsById[id]?.isDirty);

        cleanTabIds.forEach(closeTabImmediate);

        for (const tabId of dirtyTabIds) {
            const tab = tabsById[tabId];
            await activateTabAndWait(dispatch, tabId);
            const confirmed = await getConfirmation(tab?.title);
            if (!confirmed) {
                break;
            }
            closeTabImmediate(tabId);
        }

        reachMetricaGoal('closeQueryTab', {type: 'all', tabsCount: tabsOrder.length});
    }, [closeTabImmediate, dispatch, tabsById, tabsOrder]);

    const handleDuplicateTab = React.useCallback(
        (baseTabId: string) => {
            const tab = tabsById[baseTabId];
            if (!tab) {
                return;
            }

            reachMetricaGoal('duplicateQueryTab', {tabsCount: tabsOrder.length});
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
        [dispatch, tabsById, tabsOrder.length],
    );

    const handleRenameTab = React.useCallback(
        (tabId: string, title: string) => {
            dispatch(renameQueryTab({tabId, title}));
        },
        [dispatch],
    );

    const handleNewTabClick = React.useCallback(() => {
        reachMetricaGoal('createQueryTab', {tabsCount: tabsOrder.length});
        const tabId = uuidv4();
        dispatch(
            addQueryTab({
                tabId,
                title: getNewQueryTitle(newTabCounter),
                newTabCounter: newTabCounter + 1,
            }),
        );
    }, [dispatch, newTabCounter, tabsOrder.length]);

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
