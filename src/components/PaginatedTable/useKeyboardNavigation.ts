import React from 'react';

import {useTableKeyboardAdapter} from '../TableKeyboardNavigation/TableKeyboardNavigation';

import type {SortParams} from './types';

export const KeyboardRowContext = React.createContext<number | undefined>(undefined);

export interface KeyboardNavigationParams {
    tableRef: React.RefObject<HTMLElement>;
    scrollContainerRef: React.RefObject<HTMLElement>;
    onActivate?: (index: number) => void;
    getRowKey?: (index: number) => string | number | undefined;
    findRowIndex?: (key: string | number, previousIndex: number) => number | undefined;
    subscribe?: (listener: () => void) => () => void;
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

export function useKeyboardNavigation({
    tableRef,
    scrollContainerRef,
    onActivate,
    getRowKey,
    findRowIndex,
    subscribe,
    rowCount,
    rowHeight,
    filters,
    sortParams,
}: KeyboardNavigationParams) {
    const getCount = () => (tableRef.current ? getNavigationRowCount(tableRef.current) : rowCount);
    const keyboard = useTableKeyboardAdapter({
        tableRef,
        getFirst: () => (getCount() > 0 ? 0 : undefined),
        getLast: () => (getCount() > 0 ? getCount() - 1 : undefined),
        getNext: (index, step) => {
            const next = index + step;
            return next >= 0 && next < getCount() ? next : undefined;
        },
        activate: onActivate,
        getRowKey,
        findRowIndex,
        subscribe,
        isValidIndex: (index) => index >= 0 && index < getCount(),
        resetDeps: [filters, sortParams],
    });
    const focusedIndex = keyboard.selected;
    const scrolledRevision = React.useRef(0);

    React.useLayoutEffect(() => {
        if (scrolledRevision.current === keyboard.scrollRevision) {
            return;
        }
        scrolledRevision.current = keyboard.scrollRevision;
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
    }, [focusedIndex, keyboard.scrollRevision, rowHeight, scrollContainerRef, tableRef]);

    return {
        focusedIndex: keyboard.focusedIndex,
        tableProps: {
            ref: keyboard.ref,
            'data-keyboard-navigation': '',
            'data-keyboard-row-count': rowCount,
            onMouseMove: keyboard.onMouseMove,
        },
    };
}
