import React from 'react';

import type DataTable from '@gravity-ui/react-data-table';
import type {Column, DynamicInnerRefT, Settings, SortOrder} from '@gravity-ui/react-data-table';

import {cn} from '../../utils/cn';
import {useTableKeyboardAdapter} from '../TableKeyboardNavigation/TableKeyboardNavigation';
import {KEYBOARD_FOCUSED_ROW_CLASS_NAME} from '../TableKeyboardNavigation/utils';

import {getDataTableOrder} from './getDataTableOrder';

const b = cn('ydb-list-keyboard-navigation');

interface Props<T> {
    data: T[];
    columns: Column<T>[];
    settings?: Settings;
    nullBeforeNumbers?: boolean;
    onActivate?: (row: T) => void;
    getRowKey?: (row: T) => string | number | undefined;
    sortOrder?: SortOrder | SortOrder[];
    children: (options: {
        tableRef: React.RefCallback<HTMLDivElement>;
        onTableReady: React.Ref<DataTable<T>>;
        onMouseMove: React.MouseEventHandler<HTMLElement>;
        dynamicInnerRef: React.Ref<DynamicInnerRefT>;
        getRowClassName: (index: number) => string;
        active: boolean;
        onSort: (order: SortOrder | SortOrder[] | undefined) => void;
    }) => React.ReactNode;
}

export function DataTableKeyboardNavigation<T>({
    data,
    columns,
    settings,
    nullBeforeNumbers,
    onActivate,
    getRowKey,
    sortOrder,
    children,
}: Props<T>) {
    const tableRef = React.useRef<HTMLDivElement>(null);
    const [internalSort, setInternalSort] = React.useState<SortOrder | SortOrder[]>();
    const [table, setTable] = React.useState<DataTable<T> | null>(null);
    const [order, setOrder] = React.useState<{data: T[]; indices: number[]}>({data, indices: []});
    const {indices} = order;
    const virtualList = React.useRef<DynamicInnerRefT | null>(null);
    const dynamicInnerRef = React.useCallback(
        (value: DynamicInnerRefT | null) => {
            virtualList.current = value;
            const consumerRef = settings?.dynamicInnerRef;
            if (typeof consumerRef === 'function') {
                consumerRef(value);
            } else if (consumerRef) {
                (consumerRef as React.MutableRefObject<DynamicInnerRefT | null>).current = value;
            }
        },
        [settings?.dynamicInnerRef],
    );
    React.useLayoutEffect(() => {
        if (!table) {
            return;
        }
        const next = getDataTableOrder(table).filter((index) => index < data.length);
        setOrder((previous) =>
            previous.data === data &&
            previous.indices.length === next.length &&
            previous.indices.every((index, position) => index === next[position])
                ? previous
                : {data, indices: next},
        );
    }, [table, data, columns, sortOrder, internalSort, settings, nullBeforeNumbers]);
    const indexByKey = React.useMemo(() => {
        const result = new Map<string | number, number>();
        order.indices.forEach((sourceIndex, position) => {
            const key = getRowKey?.(order.data[sourceIndex]);
            if (key !== undefined) {
                result.set(key, position);
            }
        });
        return result;
    }, [order, getRowKey]);
    const keyboard = useTableKeyboardAdapter({
        tableRef,
        getFirst: () => (indices.length ? 0 : undefined),
        getLast: () => (indices.length ? indices.length - 1 : undefined),
        getNext: (index, step) => {
            const next = index + step;
            return next >= 0 && next < indices.length ? next : undefined;
        },
        activate: onActivate
            ? (index) => {
                  const row = order.data[indices[index]];
                  if (row !== undefined) {
                      onActivate(row);
                  }
              }
            : undefined,
        isValidIndex: (index) => index >= 0 && index < indices.length,
        getRowKey: (index) => {
            const row = order.data[indices[index]];
            return row === undefined ? undefined : getRowKey?.(row);
        },
        findRowIndex: getRowKey ? (key) => indexByKey.get(key) : undefined,
        resetDeps: [sortOrder, internalSort, getRowKey ? undefined : data],
    });
    const scrolledRevision = React.useRef(0);
    React.useLayoutEffect(() => {
        if (keyboard.scrollRevision === scrolledRevision.current) {
            return undefined;
        }
        if (keyboard.selected === undefined) {
            return undefined;
        }
        const sourceIndex = indices[keyboard.selected];
        if (sourceIndex === undefined) {
            return undefined;
        }
        virtualList.current?.scrollAround(keyboard.selected);
        const revealRow = () => {
            const rowClassName = b('row', {index: String(sourceIndex)});
            const row = tableRef.current?.querySelector<HTMLElement>(
                `tbody tr.${rowClassName.split(' ').join('.')}`,
            );
            if (!row) {
                return false;
            }
            const positions: Array<{element: HTMLElement; left: number}> = [];
            for (let element = row.parentElement; element; element = element.parentElement) {
                positions.push({element, left: element.scrollLeft});
            }
            row.scrollIntoView({block: 'nearest', behavior: 'instant'});
            const head = tableRef.current?.querySelector<HTMLElement>('.data-table__sticky_head');
            const overlap = head
                ? head.getBoundingClientRect().bottom - row.getBoundingClientRect().top
                : 0;
            if (overlap > 0) {
                positions
                    .find(
                        ({element}) =>
                            element.scrollHeight > element.clientHeight &&
                            /auto|scroll/.test(getComputedStyle(element).overflowY),
                    )
                    ?.element.scrollBy({top: -overlap, behavior: 'instant'});
            }
            for (const {element, left} of positions) {
                if (element.scrollLeft !== left) {
                    element.scrollLeft = left;
                }
            }
            scrolledRevision.current = keyboard.scrollRevision;
            return true;
        };
        if (revealRow()) {
            return undefined;
        }
        const container = tableRef.current;
        if (!container) {
            return undefined;
        }
        const observer = new MutationObserver(() => {
            if (revealRow()) {
                observer.disconnect();
            }
        });
        observer.observe(container, {childList: true, subtree: true});
        return () => observer.disconnect();
    }, [keyboard.selected, keyboard.scrollRevision, indices]);
    const focusedSourceIndex =
        keyboard.focusedIndex === undefined ? undefined : indices[keyboard.focusedIndex];
    return children({
        tableRef: keyboard.ref,
        onTableReady: setTable,
        onMouseMove: keyboard.onMouseMove,
        dynamicInnerRef,
        active: keyboard.focusedIndex !== undefined,
        getRowClassName: (index) =>
            b(
                'row',
                {index: String(index)},
                index === focusedSourceIndex ? KEYBOARD_FOCUSED_ROW_CLASS_NAME : undefined,
            ),
        onSort: setInternalSort,
    });
}
