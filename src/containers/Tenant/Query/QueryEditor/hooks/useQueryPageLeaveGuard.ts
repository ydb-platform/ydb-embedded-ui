import React from 'react';

import {selectTabsById, selectTabsOrder} from '../../../../../store/reducers/query/query';
import type {QueryTabState} from '../../../../../store/reducers/query/types';
import {useTypedSelector} from '../../../../../utils/hooks';

export interface QueryPageLeaveState {
    firstRunningTabId?: string;
    hasRunningTabs: boolean;
    hasDirtyTabs: boolean;
    shouldPromptOnPageLeave: boolean;
}

type PageLeaveTabState = Pick<QueryTabState, 'isDirty' | 'result'>;

export function getQueryPageLeaveState(
    tabsOrder: string[],
    tabsById: Record<string, PageLeaveTabState | undefined>,
): QueryPageLeaveState {
    const firstRunningTabId = tabsOrder.find((tabId) => tabsById[tabId]?.result?.isLoading);
    const hasDirtyTabs = tabsOrder.some((tabId) => Boolean(tabsById[tabId]?.isDirty));
    const hasRunningTabs = Boolean(firstRunningTabId);

    return {
        firstRunningTabId,
        hasRunningTabs,
        hasDirtyTabs,
        shouldPromptOnPageLeave: hasRunningTabs || hasDirtyTabs,
    };
}

export function useBeforeUnloadPrompt(enabled: boolean) {
    React.useEffect(() => {
        if (!enabled) {
            window.onbeforeunload = null;
            return;
        }

        window.onbeforeunload = (e) => {
            e.preventDefault();
            const unloadEvent = e;
            unloadEvent.returnValue = '';
            return '';
        };

        return () => {
            window.onbeforeunload = null;
        };
    }, [enabled]);
}

export function useQueryPageLeaveGuard(enabled = true) {
    const tabsOrder = useTypedSelector(selectTabsOrder);
    const tabsById = useTypedSelector(selectTabsById);

    const pageLeaveState = React.useMemo(
        () => getQueryPageLeaveState(tabsOrder, tabsById),
        [tabsOrder, tabsById],
    );

    useBeforeUnloadPrompt(enabled && pageLeaveState.shouldPromptOnPageLeave);

    return pageLeaveState;
}
