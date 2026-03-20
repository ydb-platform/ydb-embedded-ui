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
        const columnsMap = new Map(columns.map((col) => [col.name, col]));
        const savedColumnsMap = new Map(normalizedSavedColumns.map((col) => [col.id, col]));

        // Use saved columns order if user has customized it, otherwise use columns definition order
        const hasSavedOrder = savedColumns !== defaultColumnsIds && Array.isArray(savedColumns);

        if (hasSavedOrder) {
            // Preserve user's custom order from savedColumns
            const result: OrderedColumn[] = [];
            const processedIds = new Set<string>();

            // First, add columns in saved order
            for (const savedCol of normalizedSavedColumns) {
                if (columnsMap.has(savedCol.id)) {
                    result.push(savedCol);
                    processedIds.add(savedCol.id);
                }
            }

            // Then, append any new columns that weren't in saved data (in columns definition order)
            for (const column of columns) {
                if (!processedIds.has(column.name)) {
                    result.push({
                        id: column.name,
                        selected: false,
                    });
                }
            }

            return result;
        }

        // No saved order - use columns definition order with saved selection state
        return columns.map((column) => {
            const savedCol = savedColumnsMap.get(column.name);
            return {
                id: column.name,
                selected: savedCol?.selected ?? false,
            };
        });
    }, [columns, normalizedSavedColumns, savedColumns, defaultColumnsIds]);

    const columnsToSelect = React.useMemo(() => {
        const preparedColumns = orderedColumns.reduce<
            (TableColumnSetupItem & {column: T; originalIndex: number})[]
        >((acc, {id, selected}, index) => {
            const isRequired = requiredColumnsIds?.includes(id);
            const column = columns.find((c) => c.name === id);
            if (column) {
                acc.push({
                    id,
                    title: columnsTitles[id],
                    selected: Boolean(selected) || Boolean(isRequired),
                    required: isRequired,
                    sticky: isRequired ? 'start' : undefined,
                    column,
                    originalIndex: index,
                });
            }
            return acc;
        }, []);
        //required columns should be first to properly render columns settings
        //preserve original order for non-required columns
        return preparedColumns.toSorted((a, b) => {
            const aReq = Number(Boolean(a.required));
            const bReq = Number(Boolean(b.required));
            if (aReq !== bReq) {
                return bReq - aReq;
            }
            return a.originalIndex - b.originalIndex;
        });
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
