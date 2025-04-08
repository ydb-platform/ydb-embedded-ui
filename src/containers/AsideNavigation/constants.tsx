import {isMac} from './utils';

export const SHORTCUTS_HOTKEY = isMac() ? 'cmd+K' : 'ctrl+K';

// Hotkeys configuration for the keyboard shortcuts panel
export const HOTKEYS = [
    {
        title: 'Query Editor',
        items: [
            {
                title: 'Execute query',
                value: isMac() ? 'cmd+enter' : 'ctrl+enter',
            },
            {
                title: 'Execute selected query',
                value: isMac() ? 'cmd+shift+enter' : 'ctrl+shift+enter',
            },
            {
                title: 'Previous query',
                value: isMac() ? 'cmd+arrowUp' : 'ctrl+arrowUp',
            },
            {
                title: 'Next query',
                value: isMac() ? 'cmd+arrowDown' : 'ctrl+arrowDown',
            },
            {
                title: 'Save query',
                value: isMac() ? 'cmd+s' : 'ctrl+s',
            },
            {
                title: 'Save selected query',
                value: isMac() ? 'cmd+shift+s' : 'ctrl+shift+s',
            },
        ],
    },
];
