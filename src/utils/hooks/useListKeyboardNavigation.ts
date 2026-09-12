import React from 'react';

import {cn} from '../cn';

const b = cn('ydb-list-keyboard-navigation');
const rowIndexPrefix = `${b('row')}_index_`;

export const KEYBOARD_FOCUSED_ROW_CLASS_NAME = 'ydb-keyboard-focused-row';
export const KEYBOARD_FOCUS_ACTIVE_CLASS_NAME = 'ydb-keyboard-focus-active';

interface UseListKeyboardNavigationParams<T> {
    items: T[];
    onActivate: (item: T) => void;
    resetDeps: React.DependencyList;
    listContainerRef: React.RefObject<HTMLElement>;
}

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
            'textarea,button,a,select,[contenteditable="true"],[role="button"],[role="link"],[role="combobox"],[role="listbox"],[role="option"],[role="menu"],[role="menuitem"]',
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

function getClampedFocusedIndex(focusedIndex: number, itemsLength: number) {
    if (itemsLength <= 0) {
        return 0;
    }

    return Math.min(focusedIndex, itemsLength - 1);
}

export function useListKeyboardNavigation<T>({
    items,
    onActivate,
    resetDeps,
    listContainerRef,
}: UseListKeyboardNavigationParams<T>) {
    const [focusedIndex, setFocusedIndex] = React.useState(0);
    const [isFocusVisible, setIsFocusVisible] = React.useState(false);
    const [isMouseHoverOverrideActive, setIsMouseHoverOverrideActive] = React.useState(false);

    React.useEffect(() => {
        setFocusedIndex(0);
        setIsFocusVisible(false);
        setIsMouseHoverOverrideActive(false);
    }, resetDeps);

    React.useEffect(() => {
        setFocusedIndex((currentIndex) => getClampedFocusedIndex(currentIndex, items.length));
    }, [items.length]);

    React.useEffect(() => {
        if (!isFocusVisible || !items.length) {
            return;
        }

        const animationFrameId = window.requestAnimationFrame(() => {
            const rows = listContainerRef.current?.querySelectorAll('tbody tr');
            const row = Array.from(rows ?? []).find((element) =>
                element.classList.contains(`${rowIndexPrefix}${focusedIndex}`),
            );

            if (row instanceof HTMLElement) {
                const stickyHead = listContainerRef.current?.querySelector<HTMLElement>(
                    '.data-table__sticky_head',
                );
                // Wide rows can make scrollIntoView shift horizontal ancestors as well.
                // Keep their positions while allowing the selected row to scroll vertically.
                const horizontalPositions: Array<{element: HTMLElement; left: number}> = [];
                for (let element = row.parentElement; element; element = element.parentElement) {
                    horizontalPositions.push({element, left: element.scrollLeft});
                }
                row.scrollIntoView({block: 'nearest', behavior: 'instant'});
                if (stickyHead) {
                    const overlap =
                        stickyHead.getBoundingClientRect().bottom - row.getBoundingClientRect().top;
                    if (overlap > 0) {
                        const scrollContainer = horizontalPositions.find(
                            ({element}) =>
                                element.scrollHeight > element.clientHeight &&
                                /auto|scroll/.test(getComputedStyle(element).overflowY),
                        )?.element;
                        scrollContainer?.scrollBy({top: -overlap, behavior: 'instant'});
                    }
                }
                for (const {element, left} of horizontalPositions) {
                    if (element.scrollLeft !== left) {
                        element.scrollTo({left, top: element.scrollTop, behavior: 'instant'});
                    }
                }
            }
        });

        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [focusedIndex, isFocusVisible, items.length, listContainerRef]);

    const handleKeyDownCapture = React.useCallback(
        (event: Pick<KeyboardEvent, 'target' | 'key' | 'repeat' | 'preventDefault'>) => {
            if (!shouldHandleKeyboardNavigation(event.target as HTMLElement | null)) {
                return;
            }

            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                // Keep arrows reserved for list navigation even when filtering yields no rows.
                event.preventDefault();
                if (!items.length) {
                    return;
                }
                // DataTable keeps source indices after sorting; traverse rendered row order.
                const rows = listContainerRef.current?.querySelectorAll('tbody tr');
                const indices = Array.from(rows ?? []).flatMap((row) => {
                    const marker = Array.from(row.classList).find((name) =>
                        name.startsWith(rowIndexPrefix),
                    );
                    return marker ? [Number(marker.slice(rowIndexPrefix.length))] : [];
                });
                if (!indices.length) {
                    return;
                }
                const currentPosition = isFocusVisible ? indices.indexOf(focusedIndex) : 0;
                const offset = event.key === 'ArrowDown' ? 1 : -1;
                const nextPosition = Math.max(
                    0,
                    Math.min(Math.max(0, currentPosition) + offset, indices.length - 1),
                );
                setIsFocusVisible(true);
                setIsMouseHoverOverrideActive(false);
                setFocusedIndex(indices[nextPosition]);
                return;
            }

            if (event.key === 'Enter' && items.length) {
                event.preventDefault();
                // A held Enter can reach the next page after its search input receives focus.
                if (event.repeat) {
                    return;
                }
                onActivate(items[getClampedFocusedIndex(focusedIndex, items.length)]);
            }
        },
        [focusedIndex, isFocusVisible, items, listContainerRef, onActivate],
    );

    React.useEffect(() => {
        const handleDocumentKeyDown = (event: KeyboardEvent) => {
            // Back can restore focus to the document instead of the list's search input.
            if (
                !event.defaultPrevented &&
                (event.target === document.body || event.target === document.documentElement)
            ) {
                handleKeyDownCapture(event);
            }
        };
        document.addEventListener('keydown', handleDocumentKeyDown);
        return () => document.removeEventListener('keydown', handleDocumentKeyDown);
    }, [handleKeyDownCapture]);

    const getFocusedRowClassName = React.useCallback(
        (index: number, className?: string) => {
            if (index !== focusedIndex || !isFocusVisible || isMouseHoverOverrideActive) {
                return b('row', {index: String(index)}, className);
            }

            return b(
                'row',
                {index: String(index)},
                [className, KEYBOARD_FOCUSED_ROW_CLASS_NAME].filter(Boolean).join(' '),
            );
        },
        [focusedIndex, isFocusVisible, isMouseHoverOverrideActive],
    );

    const handleListMouseMoveCapture = React.useCallback(
        (event: React.MouseEvent<HTMLElement>) => {
            if (!isFocusVisible) {
                return;
            }

            const row = (event.target as HTMLElement | null)?.closest('tbody tr');

            if (row) {
                setIsMouseHoverOverrideActive(true);
            }
        },
        [isFocusVisible],
    );

    return {
        focusedIndex,
        isFocusVisible,
        isKeyboardFocusActive: isFocusVisible && !isMouseHoverOverrideActive,
        handleKeyDownCapture,
        handleListMouseMoveCapture,
        getFocusedRowClassName,
    };
}
