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
import type {QueryTabState} from '../../../../../store/reducers/query/types';
import {useEventHandler, useTypedDispatch, useTypedSelector} from '../../../../../utils/hooks';
import {getRunningQueryConfirmation} from '../../../../../utils/hooks/withConfirmation/RunningQueryDialog';
import {reachMetricaGoal} from '../../../../../utils/yaMetrica';
import {getSaveChangesConfirmation} from '../../SaveChangesDialog/SaveChangesDialog';
import i18n from '../../i18n';
import {getNewQueryTitle, getTabTitleForSave} from '../../utils/queryTabTitles';
import {useSavedQueries} from '../../utils/useSavedQueries';
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

export function useQueryTabsActions() {
    const dispatch = useTypedDispatch();
    const activeTabId = useTypedSelector(selectActiveTabId);
    const tabsOrder = useTypedSelector(selectTabsOrder);
    const tabsById = useTypedSelector(selectTabsById);
    const newTabCounter = useTypedSelector(selectNewTabCounter);
    const {savedQueries, saveQuery} = useSavedQueries();

    const getCurrentTab = useEventHandler((tabId: string) => tabsById[tabId]);

    const getDirtyConfirmation = React.useCallback(
        (tab: QueryTabState): Promise<boolean> => {
            return getSaveChangesConfirmation({
                defaultQueryName: getTabTitleForSave(tab) ?? '',
                existingQueryName: tab.savedQueryName,
                queryBody: tab.input,
                savedQueries: savedQueries ?? [],
                onSaveQuery: saveQuery,
            });
        },
        [savedQueries, saveQuery],
    );

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
            const tab = getCurrentTab(tabId);
            if (tab?.result?.isLoading) {
                const confirmed = await getRunningQueryConfirmation();
                if (!confirmed) {
                    return;
                }
            }
            const currentTab = getCurrentTab(tabId);
            if (currentTab?.isDirty) {
                const confirmed = await getDirtyConfirmation(currentTab);
                if (!confirmed) {
                    return;
                }
            }
            reachMetricaGoal('closeQueryTab', {type: 'single', tabsCount: tabsOrder.length});
            closeTabImmediate(tabId);
        },
        [closeTabImmediate, getCurrentTab, getDirtyConfirmation, tabsOrder.length],
    );

    const handleCloseActiveTab = React.useCallback(() => {
        handleCloseTab(activeTabId);
    }, [activeTabId, handleCloseTab]);

    const closeTabsWithConfirmation = React.useCallback(
        async (tabIds: string[]) => {
            const needsConfirm = (id: string) =>
                getCurrentTab(id)?.isDirty || Boolean(getCurrentTab(id)?.result?.isLoading);
            const confirmTabIds = tabIds.filter(needsConfirm);
            const cleanTabIds = tabIds.filter((id) => !needsConfirm(id));

            cleanTabIds.forEach(closeTabImmediate);

            for (const tabId of confirmTabIds) {
                await activateTabAndWait(dispatch, tabId);
                const tab = getCurrentTab(tabId);
                if (tab?.result?.isLoading) {
                    const confirmed = await getRunningQueryConfirmation();
                    if (!confirmed) {
                        break;
                    }
                }
                const currentTab = getCurrentTab(tabId);
                if (currentTab?.isDirty) {
                    const confirmed = await getDirtyConfirmation(currentTab);
                    if (!confirmed) {
                        break;
                    }
                }
                closeTabImmediate(tabId);
            }
        },
        [closeTabImmediate, dispatch, getCurrentTab, getDirtyConfirmation],
    );

    const handleCloseOtherTabs = React.useCallback(
        async (baseTabId: string) => {
            const tabsToClose = tabsOrder.filter((tabId) => tabId !== baseTabId);
            await closeTabsWithConfirmation(tabsToClose);

            reachMetricaGoal('closeQueryTab', {type: 'other', tabsCount: tabsOrder.length});
        },
        [closeTabsWithConfirmation, tabsOrder],
    );

    const handleCloseAllTabs = React.useCallback(async () => {
        await closeTabsWithConfirmation(tabsOrder);

        reachMetricaGoal('closeQueryTab', {type: 'all', tabsCount: tabsOrder.length});
    }, [closeTabsWithConfirmation, tabsOrder]);

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
