import React from 'react';

import NiceModal from '@ebay/nice-modal-react';
import {Plus} from '@gravity-ui/icons';
import {Button, Flex, Icon, TabList, TabProvider} from '@gravity-ui/uikit';

import {cn} from '../../../../../utils/cn';
import {SAVE_QUERY_DIALOG} from '../../SaveQuery/SaveQuery';
import {useSavedQueries} from '../../utils/useSavedQueries';
import {useQueryTabsActions} from '../hooks/useQueryTabsActions';

import {EditorTabItem} from './EditorTabItem';
import {RENAME_TAB_DIALOG} from './RenameTabDialog';

import './EditorTabs.scss';

const b = cn('editor-tabs');

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

    const {savedQueries, saveQuery} = useSavedQueries();

    const handleSaveQueryAs = React.useCallback(
        (tabId: string) => {
            handleActivateTab(tabId);
            const tab = tabsById[tabId];
            const commonModalProps = {savedQueries, onSaveQuery: saveQuery} as const;

            if (tab?.isTitleUserDefined) {
                NiceModal.show(SAVE_QUERY_DIALOG, {
                    ...commonModalProps,
                    defaultQueryName: tab.title,
                });
                return;
            }

            NiceModal.show(SAVE_QUERY_DIALOG, commonModalProps);
        },
        [handleActivateTab, savedQueries, saveQuery, tabsById],
    );

    const handleRenameTab = React.useCallback(
        (tabId: string, currentTitle: string) => {
            NiceModal.show(RENAME_TAB_DIALOG, {
                title: currentTitle,
                onRename: (title: string) => renameTab(tabId, title),
            });
        },
        [renameTab],
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
                <Button view="flat-secondary" size="xs" onClick={handleNewTabClick}>
                    <Button.Icon>
                        <Icon data={Plus} size={12} />
                    </Button.Icon>
                </Button>
            </div>
        </Flex>
    );
}
