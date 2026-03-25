import React from 'react';

import NiceModal from '@ebay/nice-modal-react';
import {Plus} from '@gravity-ui/icons';
import {ActionTooltip, Button, Flex, Icon, TabList, TabProvider} from '@gravity-ui/uikit';

import {cn} from '../../../../../utils/cn';
import {reachMetricaGoal} from '../../../../../utils/yaMetrica';
import {SAVE_QUERY_DIALOG, useSaveQueryWithTabSync} from '../../SaveQuery/SaveQuery';
import i18n from '../../i18n';
import {getTabTitleForSave} from '../../utils/queryTabTitles';
import {useSavedQueries} from '../../utils/useSavedQueries';
import {HOTKEY_LABELS} from '../constants';
import {useQueryTabsActions} from '../hooks/useQueryTabsActions';

import {EditorTabItem} from './EditorTabItem';
import {RENAME_QUERY_DIALOG} from './RenameQueryDialog';

import './EditorTabs.scss';

const b = cn('ydb-editor-tabs');

export function EditorTabs() {
    const {
        activeTabId,
        tabsOrder,
        tabsById,
        handleTabSwitch,
        handleActivateTab,
        handleNewTabClick,
        handleCloseTab,
        handleCloseOtherTabs,
        handleCloseAllTabs,
        handleDuplicateTab,
        handleRenameTab: renameTab,
    } = useQueryTabsActions();

    const {savedQueries} = useSavedQueries();
    const createSaveQueryHandler = useSaveQueryWithTabSync();

    const handleSaveQueryAs = React.useCallback(
        (tabId: string) => {
            reachMetricaGoal('saveQueryFromTab', {tabsCount: tabsOrder.length});
            const tab = tabsById[tabId];
            const queryBody = tab?.input ?? '';
            const defaultQueryName = getTabTitleForSave(tab);

            NiceModal.show(SAVE_QUERY_DIALOG, {
                savedQueries,
                onSaveQuery: createSaveQueryHandler(tabId),
                queryBody,
                defaultQueryName,
            });
        },
        [createSaveQueryHandler, savedQueries, tabsById, tabsOrder.length],
    );

    const handleRenameTab = React.useCallback(
        (tabId: string, currentTitle: string) => {
            reachMetricaGoal('renameQueryTab', {tabsCount: tabsOrder.length});
            NiceModal.show(RENAME_QUERY_DIALOG, {
                title: currentTitle,
                onRename: (title: string) => renameTab(tabId, title),
            });
        },
        [renameTab, tabsOrder.length],
    );

    return (
        <Flex className={b()} alignItems="center">
            <TabProvider value={activeTabId} onUpdate={handleTabSwitch}>
                <TabList size="m">
                    {tabsOrder.map((tabId) => {
                        const tab = tabsById[tabId];
                        if (!tab) {
                            return null;
                        }

                        return (
                            <EditorTabItem
                                key={tabId}
                                tabId={tabId}
                                tab={tab}
                                isActive={tabId === activeTabId}
                                onActivate={handleActivateTab}
                                onCloseTab={handleCloseTab}
                                onDuplicateTab={handleDuplicateTab}
                                onRenameTab={handleRenameTab}
                                onSaveQueryAs={handleSaveQueryAs}
                                onCloseOtherTabs={handleCloseOtherTabs}
                                onCloseAllTabs={handleCloseAllTabs}
                            />
                        );
                    })}
                </TabList>
            </TabProvider>
            <div className={b('add-icon-button')}>
                <ActionTooltip
                    title={i18n('editor-tabs.action.new-tab')}
                    placement={['top-start', 'top-end', 'bottom-start', 'bottom-end']}
                    hotkey={HOTKEY_LABELS.newTab}
                >
                    <Button
                        view="flat-secondary"
                        size="xs"
                        onClick={handleNewTabClick}
                        aria-label={i18n('editor-tabs.action.new-tab')}
                    >
                        <Icon data={Plus} size={12} />
                    </Button>
                </ActionTooltip>
            </div>
        </Flex>
    );
}
