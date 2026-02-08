import React from 'react';

import type {HotkeysGroup} from '@gravity-ui/navigation';
import {HotkeysPanel as UIKitHotkeysPanel} from '@gravity-ui/navigation';
import {Hotkey} from '@gravity-ui/uikit';
import hotkeys from 'hotkeys-js';

import {cn} from '../../../utils/cn';
import {isMacOS} from '../../../utils/platform';
import i18n from '../i18n';

const b = cn('kv-navigation');

export const isMac = isMacOS;

export const SHORTCUTS_HOTKEY = isMac() ? 'cmd+K' : 'ctrl+K';

export const DEFAULT_HOTKEY_GROUPS: HotkeysGroup[] = [
    {
        title: 'Query Editor',
        items: [
            {
                title: i18n('hotkeys.execute-query'),
                value: isMac() ? 'cmd+enter' : 'ctrl+enter',
            },
            {
                title: i18n('hotkeys.execute-selected-query'),
                value: isMac() ? 'cmd+shift+enter' : 'ctrl+shift+enter',
            },
            {
                title: i18n('hotkeys.save-query'),
                value: isMac() ? 'cmd+s' : 'ctrl+s',
            },
            {
                title: i18n('hotkeys.save-selected-query'),
                value: isMac() ? 'cmd+shift+s' : 'ctrl+shift+s',
            },
        ],
    },
];

export interface HotkeysPanelProps {
    visible: boolean;
    closePanel: () => void;
    hotkeyGroups?: HotkeysGroup[];
}

/**
 * HotkeysPanelWrapper creates a render cycle separation between mounting and visibility change.
 * This is necessary for smooth animations as HotkeysPanel uses CSSTransition internally.
 *
 * When a component is both mounted and set to visible at once, CSSTransition can't
 * properly sequence its transition classes (panel → panel-active) because it's already active when mounted
 * and counts transition as it has already happened.
 * This wrapper ensures the component mounts first, then sets visible=true in a subsequent render cycle
 * to make transition actually happen.
 */
export const HotkeysPanelWrapper = ({
    visible: propsVisible,
    closePanel,
    hotkeyGroups = DEFAULT_HOTKEY_GROUPS,
}: HotkeysPanelProps) => {
    const [visible, setVisible] = React.useState(false);

    React.useEffect(() => {
        setVisible(propsVisible);
    }, [propsVisible]);

    return (
        <UIKitHotkeysPanel
            visible={visible}
            hotkeys={hotkeyGroups}
            className={b('hotkeys-panel')}
            drawerItemClassName={b('hotkeys-drawer')}
            title={
                <div className={b('hotkeys-panel-title')}>
                    {i18n('hotkeys.title')}
                    <Hotkey value={SHORTCUTS_HOTKEY} />
                </div>
            }
            onClose={closePanel}
        />
    );
};

interface UseHotkeysPanel {
    isPanelVisible: boolean;
    openPanel: () => void;
    closePanel: () => void;
    hotkeyGroups?: HotkeysGroup[];
}

export const useHotkeysPanel = ({
    isPanelVisible,
    openPanel,
    closePanel,
    hotkeyGroups = DEFAULT_HOTKEY_GROUPS,
}: UseHotkeysPanel) => {
    React.useEffect(() => {
        hotkeys(SHORTCUTS_HOTKEY, openPanel);

        window.addEventListener('openKeyboardShortcutsPanel', openPanel);

        return () => {
            hotkeys.unbind(SHORTCUTS_HOTKEY);
            window.removeEventListener('openKeyboardShortcutsPanel', openPanel);
        };
    }, [openPanel]);

    const renderPanel = React.useCallback(
        () => (
            <HotkeysPanelWrapper
                visible={isPanelVisible}
                closePanel={closePanel}
                hotkeyGroups={hotkeyGroups}
            />
        ),
        [isPanelVisible, closePanel, hotkeyGroups],
    );

    return {
        renderPanel,
    };
};
