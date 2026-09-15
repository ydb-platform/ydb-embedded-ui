import {cn} from '../../utils/cn';

export const KEYBOARD_FOCUSED_ROW_CLASS_NAME = cn('ydb-keyboard-focused-row')();
export const KEYBOARD_FOCUS_ACTIVE_CLASS_NAME = cn('ydb-keyboard-focus-active')();

function isTextInput(target: HTMLElement) {
    if (target.tagName !== 'INPUT') {
        return false;
    }

    const input = target as HTMLInputElement;

    return ['text', 'search', 'email', 'url', 'tel', 'password', ''].includes(input.type);
}

export function shouldHandleKeyboardNavigation(target: HTMLElement | null) {
    if (!target) {
        return true;
    }

    if (
        target.closest(
            'textarea,button,a,select,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="spinbutton"],[role="slider"],[role="checkbox"],[role="radio"],[role="radiogroup"],[role="switch"],[role="link"],[role="combobox"],[role="listbox"],[role="option"],[role="menu"],[role="menuitem"],[role="tree"],[role="treeitem"],[role="tablist"],[role="tab"],[role="grid"]',
        )
    ) {
        return false;
    }

    const input = target.closest('input');

    if (input instanceof HTMLElement) {
        return isTextInput(input);
    }

    return true;
}
