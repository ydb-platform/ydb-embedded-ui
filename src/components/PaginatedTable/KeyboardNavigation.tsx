import type React from 'react';

import {KEYBOARD_FOCUS_ACTIVE_CLASS_NAME} from '../TableKeyboardNavigation/utils';

import {KeyboardRowContext, useKeyboardNavigation} from './useKeyboardNavigation';
import type {KeyboardNavigationParams} from './useKeyboardNavigation';

interface KeyboardNavigationProps extends Omit<KeyboardNavigationParams, 'tableRef'> {
    tableRef: React.RefObject<HTMLDivElement>;
    children: React.ReactNode;
    className?: string;
}

export function KeyboardNavigation({children, className, ...params}: KeyboardNavigationProps) {
    const keyboard = useKeyboardNavigation(params);
    const tableClassName = [
        className,
        keyboard.focusedIndex !== undefined ? KEYBOARD_FOCUS_ACTIVE_CLASS_NAME : undefined,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={tableClassName} {...keyboard.tableProps}>
            <KeyboardRowContext.Provider value={keyboard.focusedIndex}>
                {children}
            </KeyboardRowContext.Provider>
        </div>
    );
}
