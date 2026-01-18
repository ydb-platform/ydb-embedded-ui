import React from 'react';

import NiceModal from '@ebay/nice-modal-react';
import {
    CirclePlus,
    Copy,
    Ellipsis,
    FloppyDisk,
    PaperPlane,
    Pencil,
    StarFill,
    Xmark,
} from '@gravity-ui/icons';
import type {DropdownMenuItem} from '@gravity-ui/uikit';
import {Button, DropdownMenu, Flex, Loader, Tab, TabList, TabProvider} from '@gravity-ui/uikit';
import {v4 as uuidv4} from 'uuid';

import {
    addQueryTab,
    closeQueryTab,
    renameQueryTab,
    setActiveQueryTab,
} from '../../../../store/reducers/query/query';
import type {QueryTabState} from '../../../../store/reducers/query/types';
import {cn} from '../../../../utils/cn';
import {useTypedDispatch} from '../../../../utils/hooks';
import {SAVE_QUERY_DIALOG} from '../SaveQuery/SaveQuery';
import i18n from '../i18n';
import {useSavedQueries} from '../utils/useSavedQueries';

import {RENAME_TAB_DIALOG} from './RenameTabDialog';
import {queryManagerInstance} from './helpers';
import {useQueryTabsActions} from './useQueryTabsActions';

const b = cn('query-editor');

interface EditorTabItemProps {
    tabId: string;
    tab: QueryTabState;
    isActive: boolean;
    onActivate: (tabId: string) => void;
    onCloseTab: (tabId: string) => void;
    onDuplicateTab: (tabId: string) => void;
    onRenameTab: (tabId: string, currentTitle: string) => void;
    onSaveQueryAs: (tabId: string) => void;
    onCloseOtherTabs: (tabId: string) => void;
    onCloseAllTabs: () => void;
}

function EditorTabItem({
    tabId,
    tab,
    isActive,
    onActivate,
    onCloseTab,
    onDuplicateTab,
    onRenameTab,
    onSaveQueryAs,
    onCloseOtherTabs,
    onCloseAllTabs,
}: EditorTabItemProps) {
    const title = tab.title || i18n('editor-tabs.untitled');
    const isDirty = Boolean(tab.isDirty);
    const isLoading = Boolean(tab.result?.isLoading);

    const handleMenuSwitcherClick = React.useCallback(
        (event: React.MouseEvent<HTMLElement>) => {
            event.stopPropagation();
            onActivate(tabId);
        },
        [onActivate, tabId],
    );

    const handleCloseClick = React.useCallback(
        (event: React.MouseEvent<HTMLElement>) => {
            event.stopPropagation();
            onCloseTab(tabId);
        },
        [onCloseTab, tabId],
    );

    const handleRenameClick = React.useCallback(() => {
        onRenameTab(tabId, tab.title);
    }, [onRenameTab, tab.title, tabId]);

    const handleDuplicateClick = React.useCallback(() => {
        onDuplicateTab(tabId);
    }, [onDuplicateTab, tabId]);

    const handleSaveQueryAsClick = React.useCallback(() => {
        onSaveQueryAs(tabId);
    }, [onSaveQueryAs, tabId]);

    const handleCloseOtherTabsClick = React.useCallback(() => {
        onCloseOtherTabs(tabId);
    }, [onCloseOtherTabs, tabId]);

    const handleCloseAllTabsClick = React.useCallback(() => {
        onCloseAllTabs();
    }, [onCloseAllTabs]);

    const tabMenuItems = React.useMemo<DropdownMenuItem[][]>(() => {
        const shortcut = (value: string) => <span>{value}</span>;

        return [
            [
                {
                    text: i18n('editor-tabs.rename'),
                    iconStart: <Pencil />,
                    iconEnd: shortcut('⌘T'),
                    action: handleRenameClick,
                },
                {
                    text: i18n('editor-tabs.duplicate'),
                    iconStart: <Copy />,
                    action: handleDuplicateClick,
                },
            ],
            [
                {
                    text: i18n('editor-tabs.add-to-favorites'),
                    iconStart: <StarFill />,
                    disabled: true,
                    action: () => {},
                },
                {
                    text: i18n('editor-tabs.save-query-as'),
                    iconStart: <FloppyDisk />,
                    iconEnd: shortcut('⌘⇧S'),
                    action: handleSaveQueryAsClick,
                },
                {
                    text: i18n('editor-tabs.share-query'),
                    iconStart: <PaperPlane />,
                    disabled: true,
                    action: () => {},
                },
            ],
            [
                {
                    text: i18n('editor-tabs.close'),
                    iconStart: <Xmark />,
                    iconEnd: shortcut('⌘⌫'),
                    action: () => onCloseTab(tabId),
                },
                {
                    text: i18n('editor-tabs.close-other-tabs'),
                    iconStart: <Xmark />,
                    iconEnd: shortcut('⌘⇧⌫'),
                    action: handleCloseOtherTabsClick,
                },
                {
                    text: i18n('editor-tabs.close-all-tabs'),
                    iconStart: <Xmark />,
                    iconEnd: shortcut('⌘⌥⌫'),
                    action: handleCloseAllTabsClick,
                },
            ],
        ];
    }, [
        handleCloseAllTabsClick,
        handleCloseOtherTabsClick,
        handleDuplicateClick,
        handleRenameClick,
        handleSaveQueryAsClick,
        onCloseTab,
        tabId,
    ]);

    const renderTabMenuSwitcher = React.useCallback((props: React.HTMLAttributes<HTMLElement>) => {
        return (
            <span {...props} className={b('editor-tab-action', {menu: true})}>
                <Ellipsis />
            </span>
        );
    }, []);

    return (
        <Tab value={tabId}>
            <Flex className={b('editor-tab')} alignItems="center" gap={1}>
                <span className={b('editor-tab-title')}>{title}</span>
                {isDirty ? <span className={b('editor-tab-indicator', {dirty: true})} /> : null}
                {isLoading ? (
                    <span className={b('editor-tab-indicator', {loading: true})}>
                        <Loader size="s" />
                    </span>
                ) : null}
                <Flex className={b('editor-tab-actions')} alignItems="center" gap={0}>
                    <span
                        className={b('editor-tab-action', {close: true, active: isActive})}
                        onClick={handleCloseClick}
                    >
                        <Xmark />
                    </span>
                    <DropdownMenu
                        items={tabMenuItems}
                        onSwitcherClick={handleMenuSwitcherClick}
                        renderSwitcher={renderTabMenuSwitcher}
                        switcherWrapperClassName={b('editor-tab-menu-switcher')}
                        popupProps={{
                            placement: ['bottom-start', 'top-start'],
                            floatingStyles: {width: 264},
                        }}
                        size="m"
                    />
                </Flex>
            </Flex>
        </Tab>
    );
}

export function EditorTabs() {
    const dispatch = useTypedDispatch();
    const {activeTabId, tabsOrder, tabsById, handleTabSwitch, handleNewTabClick} =
        useQueryTabsActions();

    const {savedQueries, saveQuery} = useSavedQueries();

    const handleActivateTab = React.useCallback(
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

    const handleCloseOtherTabs = React.useCallback(
        (baseTabId: string) => {
            tabsOrder.filter((tabId) => tabId !== baseTabId).forEach(closeTab);
        },
        [closeTab, tabsOrder],
    );

    const handleCloseAllTabs = React.useCallback(() => {
        tabsOrder.forEach(closeTab);
    }, [closeTab, tabsOrder]);

    const handleSaveQueryAs = React.useCallback(
        (tabId: string) => {
            dispatch(setActiveQueryTab({tabId}));
            NiceModal.show(SAVE_QUERY_DIALOG, {
                savedQueries,
                onSaveQuery: saveQuery,
            });
        },
        [dispatch, savedQueries, saveQuery],
    );

    const handleRenameTab = React.useCallback(
        (tabId: string, currentTitle: string) => {
            NiceModal.show(RENAME_TAB_DIALOG, {
                title: currentTitle,
                onRename: (title: string) => dispatch(renameQueryTab({tabId, title})),
            });
        },
        [dispatch],
    );

    const handleDuplicateTab = React.useCallback(
        (tabId: string) => {
            const tab = tabsById[tabId];
            if (!tab) {
                return;
            }

            const newTabId = uuidv4();
            const baseTitle = tab.title || i18n('editor-tabs.untitled');

            dispatch(
                addQueryTab({
                    tabId: newTabId,
                    title: i18n('editor-tabs.duplicate-title', {title: baseTitle}),
                    input: tab.input,
                    makeActive: true,
                }),
            );
        },
        [dispatch, tabsById],
    );

    const renderEditorTab = React.useCallback(
        (tabId: string) => {
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
                    onCloseTab={closeTab}
                    onDuplicateTab={handleDuplicateTab}
                    onRenameTab={handleRenameTab}
                    onSaveQueryAs={handleSaveQueryAs}
                    onCloseOtherTabs={handleCloseOtherTabs}
                    onCloseAllTabs={handleCloseAllTabs}
                />
            );
        },
        [
            activeTabId,
            closeTab,
            handleActivateTab,
            handleCloseAllTabs,
            handleCloseOtherTabs,
            handleDuplicateTab,
            handleRenameTab,
            handleSaveQueryAs,
            tabsById,
        ],
    );

    return (
        <Flex className={b('editor-tabs')} alignItems="center" justifyContent="space-between">
            <TabProvider value={activeTabId} onUpdate={handleTabSwitch}>
                <TabList size="m">{tabsOrder.map(renderEditorTab)}</TabList>
            </TabProvider>
            <Flex className={b('editor-tabs-actions')} alignItems="center" gap={1}>
                <Button view="flat-secondary" size="xs" onClick={handleNewTabClick}>
                    <Button.Icon>
                        <CirclePlus />
                    </Button.Icon>
                </Button>
            </Flex>
        </Flex>
    );
}
