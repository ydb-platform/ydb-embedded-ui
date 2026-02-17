import React from 'react';

import {Copy, Ellipsis, FloppyDisk, Pencil, Xmark} from '@gravity-ui/icons';
import type {DropdownMenuItem} from '@gravity-ui/uikit';
import {DropdownMenu, Flex, Hotkey, Icon, Tab, Text} from '@gravity-ui/uikit';

import type {QueryTabState} from '../../../../../store/reducers/query/types';
import {cn} from '../../../../../utils/cn';
import i18n from '../../i18n';
import {isQueryCancelledError} from '../../utils/isQueryCancelledError';

import type {TabExecutionStatus} from './TabExecutionStatusIndicator';
import {TabExecutionStatusIndicator} from './TabExecutionStatusIndicator';

import './EditorTabItem.scss';

const b = cn('editor-tab-item');

const HOTKEY_LABELS = {
    renameTab: 'mod+alt+r',
    duplicateTab: 'mod+alt+c',
    closeTab: 'mod+backspace',
    closeOtherTabs: 'mod+alt+backspace',
    closeAllTabs: 'mod+shift+backspace',
    saveQueryAs: 'mod+shift+s',
} as const;

function getTabExecutionStatus(tab: QueryTabState): TabExecutionStatus | undefined {
    const result = tab.result;
    if (!result) {
        return undefined;
    }

    if (result.isLoading) {
        return 'in_progress';
    }

    if (result.error) {
        return isQueryCancelledError(result.error) ? 'stopped' : 'failed';
    }

    return 'done';
}

export interface EditorTabItemProps {
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

export function EditorTabItem({
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
    const title = tab.title || i18n('editor-tabs.default-title');
    const isDirty = Boolean(tab.isDirty);
    const executionStatus = getTabExecutionStatus(tab);
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isMenuClosing, setIsMenuClosing] = React.useState(false);

    const handleMenuSwitcherClick = React.useCallback(
        (event: React.MouseEvent<HTMLElement>) => {
            event.stopPropagation();
            onActivate(tabId);
        },
        [onActivate, tabId],
    );

    const handleMenuOpenToggle = React.useCallback((open: boolean) => {
        if (open) {
            setIsMenuOpen(true);
            setIsMenuClosing(false);
        } else {
            setIsMenuOpen(false);
            setIsMenuClosing(true);
        }
    }, []);

    const handleMenuTransitionOutComplete = React.useCallback(() => {
        setIsMenuClosing(false);
    }, []);

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
        return [
            [
                {
                    text: i18n('editor-tabs.rename-query'),
                    iconStart: <Pencil />,
                    iconEnd: <Hotkey value={HOTKEY_LABELS.renameTab} />,
                    action: handleRenameClick,
                },
                {
                    text: i18n('editor-tabs.duplicate'),
                    iconStart: <Copy />,
                    iconEnd: <Hotkey value={HOTKEY_LABELS.duplicateTab} />,
                    action: handleDuplicateClick,
                },
            ],
            [
                {
                    text: i18n('editor-tabs.save-query-as'),
                    iconStart: <FloppyDisk />,
                    iconEnd: <Hotkey value={HOTKEY_LABELS.saveQueryAs} />,
                    action: handleSaveQueryAsClick,
                },
            ],
            [
                {
                    text: i18n('editor-tabs.close'),
                    iconStart: <Xmark />,
                    iconEnd: <Hotkey value={HOTKEY_LABELS.closeTab} />,
                    action: () => onCloseTab(tabId),
                },
                {
                    text: i18n('editor-tabs.close-other-tabs'),
                    iconStart: <Xmark />,
                    iconEnd: <Hotkey value={HOTKEY_LABELS.closeOtherTabs} />,
                    action: handleCloseOtherTabsClick,
                },
                {
                    text: i18n('editor-tabs.close-all-tabs'),
                    iconStart: <Xmark />,
                    iconEnd: <Hotkey value={HOTKEY_LABELS.closeAllTabs} />,
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
            <span {...props} className={b('tab-action', {menu: true})}>
                <Ellipsis />
            </span>
        );
    }, []);

    return (
        <Tab value={tabId} className={b('tab-root', {menuOpen: isMenuOpen || isMenuClosing})}>
            <Flex className={b('tab')} alignItems="center" gap={1}>
                <TabExecutionStatusIndicator status={executionStatus} />
                <Text variant="caption-2" className={b('tab-title')}>
                    {title}
                </Text>
                <Flex className={b('tab-additional', {dirty: isDirty})} alignItems="center" gap={0}>
                    {isDirty ? <div className={b('tab-dirty', {active: isActive})} /> : null}
                    <span className={b('tab-action', {active: isActive})}>
                        <DropdownMenu
                            items={tabMenuItems}
                            open={isMenuOpen}
                            onOpenToggle={handleMenuOpenToggle}
                            onSwitcherClick={handleMenuSwitcherClick}
                            renderSwitcher={renderTabMenuSwitcher}
                            switcherWrapperClassName={b('tab-menu-switcher')}
                            popupProps={{
                                placement: ['bottom-start', 'top-start'],
                                floatingStyles: {width: 264},
                                onTransitionOutComplete: handleMenuTransitionOutComplete,
                            }}
                            size="s"
                        />
                    </span>
                    <span
                        className={b('tab-action', {close: true, active: isActive})}
                        onClick={handleCloseClick}
                    >
                        <Icon data={Xmark} size={12} />
                    </span>
                </Flex>
            </Flex>
        </Tab>
    );
}
