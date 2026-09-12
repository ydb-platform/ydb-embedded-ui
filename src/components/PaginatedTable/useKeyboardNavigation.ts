import React from 'react';

import {useEventHandler} from '../../utils/hooks/useEventHandler';
import {shouldHandleKeyboardNavigation} from '../../utils/hooks/useListKeyboardNavigation';

import {b} from './shared';
import type {SortParams} from './types';

const SELECT_EVENT = 'ydb-paginated-table-keyboard-select';
const TABLE_SELECTOR = '[data-keyboard-navigation]';

export const KeyboardRowContext = React.createContext<number | undefined>(undefined);

interface Selection {
    table: HTMLElement;
    index: number;
}

interface KeyboardNavigationParams {
    tableRef: React.RefObject<HTMLElement>;
    scrollContainerRef: React.RefObject<HTMLElement>;
    linkSelector?: string;
    rowCount: number;
    rowHeight: number;
    filters?: unknown;
    sortParams?: SortParams;
}

function getNavigationRowCount(table: HTMLElement) {
    const loadedRows = table.querySelectorAll<HTMLElement>('[data-row-index]');
    return Array.from(loadedRows).reduce(
        (count, row) => Math.max(count, Number(row.dataset.rowIndex) + 1),
        Number(table.dataset.keyboardRowCount) || 0,
    );
}

function getActiveTable(target: HTMLElement, tables: HTMLElement[], container: HTMLElement) {
    const containerRect = container.getBoundingClientRect();
    return (
        target.closest(TABLE_SELECTOR) ??
        tables.find((element) => element.dataset.keyboardActive === 'true') ??
        tables.find((element) => {
            const rect = element.getBoundingClientRect();
            return rect.bottom > containerRect.top && rect.top < containerRect.bottom;
        }) ??
        tables[0]
    );
}

function isListKeyEvent(
    event: KeyboardEvent,
    container: HTMLElement,
): event is KeyboardEvent & {target: HTMLElement} {
    const target = event.target;
    return (
        !event.defaultPrevented &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        target instanceof HTMLElement &&
        shouldHandleKeyboardNavigation(target) &&
        (container.contains(target) ||
            target === document.body ||
            target === document.documentElement)
    );
}

export function useKeyboardNavigation({
    tableRef,
    scrollContainerRef,
    linkSelector,
    rowCount,
    rowHeight,
    filters,
    sortParams,
}: KeyboardNavigationParams) {
    const [focusedIndex, setFocusedIndex] = React.useState<number>();
    const [hoverOverride, setHoverOverride] = React.useState(false);
    const getFocusedIndex = useEventHandler(() => focusedIndex);

    React.useEffect(() => {
        setFocusedIndex(undefined);
        setHoverOverride(false);
    }, [filters, sortParams]);

    React.useEffect(() => {
        setFocusedIndex((index) =>
            index === undefined || !rowCount ? undefined : Math.min(index, rowCount - 1),
        );
    }, [rowCount]);

    React.useEffect(() => {
        const table = tableRef.current;
        const container = scrollContainerRef.current;
        if (!linkSelector || !table || !container) {
            return undefined;
        }

        const select = (targetTable: HTMLElement, index: number) => {
            document.dispatchEvent(
                new CustomEvent<Selection>(SELECT_EVENT, {detail: {table: targetTable, index}}),
            );
        };
        const onSelect = (event: Event) => {
            const selection = (event as CustomEvent<Selection>).detail;
            if (container.contains(selection.table)) {
                setFocusedIndex(selection.table === table ? selection.index : undefined);
                setHoverOverride(false);
            }
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (!isListKeyEvent(event, container)) {
                return;
            }
            const target = event.target;
            const currentIndex = getFocusedIndex();
            const currentRowCount = getNavigationRowCount(table);
            const tables = Array.from(container.querySelectorAll<HTMLElement>(TABLE_SELECTOR));
            const activeTable = getActiveTable(target, tables, container);
            if (activeTable !== table) {
                return;
            }
            if (event.key === 'Enter') {
                event.preventDefault();
                if (!event.repeat && currentRowCount) {
                    table
                        .querySelector<HTMLAnchorElement>(
                            `[data-row-index="${currentIndex ?? 0}"] ${linkSelector}`,
                        )
                        ?.click();
                }
                return;
            }
            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
                return;
            }
            event.preventDefault();
            if (!currentRowCount) {
                return;
            }
            const step = event.key === 'ArrowDown' ? 1 : -1;
            const nextIndex = (currentIndex ?? 0) + step;
            // Expanded groups are separate virtual tables in the same scroll container.
            if (currentIndex !== undefined && (nextIndex < 0 || nextIndex >= currentRowCount)) {
                const adjacentTable = tables[tables.indexOf(table) + step];
                const adjacentCount = adjacentTable ? getNavigationRowCount(adjacentTable) : 0;
                if (adjacentTable && adjacentCount > 0) {
                    select(adjacentTable, step > 0 ? 0 : adjacentCount - 1);
                    return;
                }
            }
            select(table, Math.max(0, Math.min(nextIndex, currentRowCount - 1)));
        };
        document.addEventListener(SELECT_EVENT, onSelect);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener(SELECT_EVENT, onSelect);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [getFocusedIndex, linkSelector, scrollContainerRef, tableRef]);

    React.useLayoutEffect(() => {
        const table = tableRef.current;
        const container = scrollContainerRef.current;
        if (focusedIndex === undefined || !table || !container) {
            return;
        }
        const head = table.querySelector('thead');
        const body = table.querySelector('tbody');
        if (!head || !body) {
            return;
        }
        const row = table.querySelector<HTMLElement>(`[data-row-index="${focusedIndex}"]`);
        const containerRect = container.getBoundingClientRect();
        const headRect = head.getBoundingClientRect();
        const stickyTop = Number.parseFloat(getComputedStyle(head).top) || 0;
        const visibleTop = Math.max(
            headRect.bottom,
            containerRect.top + stickyTop + headRect.height,
        );
        const rowRect = row?.getBoundingClientRect();
        // Scroll to unloaded rows as well, letting the existing chunk loader fetch them.
        const top = rowRect?.top ?? body.getBoundingClientRect().top + focusedIndex * rowHeight;
        const bottom = rowRect?.bottom ?? top + rowHeight;
        const visibleBottom = Math.min(
            window.innerHeight,
            containerRect.top + container.clientHeight,
        );
        const delta = top < visibleTop ? top - visibleTop : Math.max(0, bottom - visibleBottom);
        if (delta) {
            container.scrollBy({top: delta, behavior: 'instant'});
        }
    }, [focusedIndex, rowHeight, scrollContainerRef, tableRef]);

    const onMouseMove = (event: React.MouseEvent<HTMLElement>) => {
        if ((event.target as HTMLElement).closest(`.${b('row')}`)) {
            setHoverOverride(true);
        }
    };

    return {
        focusedIndex: hoverOverride ? undefined : focusedIndex,
        tableProps: {
            'data-keyboard-navigation': linkSelector ? '' : undefined,
            'data-keyboard-active': focusedIndex === undefined ? undefined : 'true',
            'data-keyboard-row-count': linkSelector ? rowCount : undefined,
            onMouseMove: linkSelector ? onMouseMove : undefined,
        },
    };
}
