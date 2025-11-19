import React from 'react';

import type {TableColumnSetupItem, TableColumnSetupProps} from '@gravity-ui/uikit';

import {useSetting} from '../../store/reducers/settings/useSetting';

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
    const {value: savedColumns, saveValue: saveColumns} = useSetting<string[] | OrderedColumn[]>(
        storageKey,
    );

    const normalizeSavedColumns = React.useCallback(
        (columnsToUse: string[] | OrderedColumn[]) => {
            const parsedSavedColumns = columnsToUse
                .map(parseSavedColumn)
                .filter((column): column is OrderedColumn => Boolean(column));

            const needToNormalize =
                (columnsToUse.length && typeof columnsToUse[0] === 'string') ||
                parsedSavedColumns.length !== columns.length;

            if (needToNormalize) {
                return columns.reduce<OrderedColumn[]>((acc, column) => {
                    const savedColumn = parsedSavedColumns.find((c) => c && c.id === column.name);
                    if (savedColumn) {
                        acc.push(savedColumn);
                    } else {
                        acc.push({id: column.name, selected: false});
                    }
                    return acc;
                }, []);
            }

            return parsedSavedColumns;
        },
        [columns],
    );

    const [orderedColumns, setOrderedColumns] = React.useState(() => {
        return normalizeSavedColumns(savedColumns ?? defaultColumnsIds);
    });

    React.useEffect(() => {
        const rawColumns = savedColumns !== undefined ? savedColumns : defaultColumnsIds;
        const normalizedColumns = normalizeSavedColumns(rawColumns);

        setOrderedColumns(normalizedColumns);
    }, [savedColumns, defaultColumnsIds]);

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

            saveColumns(preparedColumns);
            setOrderedColumns(preparedColumns);
        },
        [saveColumns],
    );

    return {
        columnsToShow,
        columnsToSelect,
        setColumns,
    };
};
