import React from 'react';

import type {TableColumnSetupItem, TableColumnSetupProps} from '@gravity-ui/uikit';

import {useSetting} from './useSetting';

type OrderedColumn = {id: string; selected?: boolean};

function parseSavedColumn(saved: unknown): OrderedColumn | undefined {
    if (typeof saved === 'string') {
        return {id: saved, selected: true};
    }
    if (saved && typeof saved === 'object' && 'id' in saved && typeof saved.id === 'string') {
        const selected = 'selected' in saved ? Boolean(saved.selected) : false;
        return {id: saved.id, selected};
    }
    return undefined;
}

export const useSelectedColumns = <T extends {name: string}>(
    columns: T[],
    storageKey: string,
    columnsTitles: Record<string, string>,
    defaultColumnsIds: string[],
    requiredColumnsIds?: string[],
) => {
    const [savedColumns, setSavedColumns] = useSetting<unknown[]>(storageKey, defaultColumnsIds);

    const normalizedSavedColumns = React.useMemo(() => {
        const rawValue = Array.isArray(savedColumns) ? savedColumns : defaultColumnsIds;
        return rawValue.map(parseSavedColumn).filter((c): c is OrderedColumn => c !== undefined);
    }, [defaultColumnsIds, savedColumns]);

    const orderedColumns = React.useMemo(() => {
        const columnsSet = new Set(columns.map((col) => col.name));
        const ordered: OrderedColumn[] = [];
        const addedIds = new Set<string>();

        normalizedSavedColumns.forEach((savedCol) => {
            if (columnsSet.has(savedCol.id)) {
                ordered.push(savedCol);
                addedIds.add(savedCol.id);
            }
        });

        columns.forEach((column) => {
            if (!addedIds.has(column.name)) {
                ordered.push({id: column.name, selected: false});
            }
        });

        return ordered;
    }, [columns, normalizedSavedColumns]);

    const columnsToSelect = React.useMemo(() => {
        const preparedColumns = orderedColumns.reduce<(TableColumnSetupItem & {column: T})[]>(
            (acc, {id, selected}) => {
                const isRequired = requiredColumnsIds?.includes(id);
                const column = columns.find((c) => c.name === id);
                if (column) {
                    acc.push({
                        id,
                        title: columnsTitles[id],
                        selected: selected || isRequired,
                        required: isRequired,
                        sticky: isRequired ? 'start' : undefined,
                        column,
                    });
                }
                return acc;
            },
            [],
        );
        //required columns should be first to properly render columns settings
        return preparedColumns.toSorted(
            (a, b) => Number(Boolean(b.required)) - Number(Boolean(a.required)),
        );
    }, [columns, columnsTitles, requiredColumnsIds, orderedColumns]);

    const columnsToShow = React.useMemo(() => {
        return columnsToSelect.filter((c) => c.selected).map((c) => c.column);
    }, [columnsToSelect]);

    const setColumns: TableColumnSetupProps['onUpdate'] = React.useCallback(
        (value) => {
            const preparedColumns = value.map(({id, selected}) => ({id, selected}));

            setSavedColumns(preparedColumns);
        },
        [setSavedColumns],
    );

    return {
        columnsToShow,
        columnsToSelect,
        setColumns,
    };
};
