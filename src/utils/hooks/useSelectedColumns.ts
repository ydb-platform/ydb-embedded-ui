import React from 'react';

import type {TableColumnSetupItem, TableColumnSetupProps} from '@gravity-ui/uikit';

import {settingsManager} from '../../services/settings';

export const useSelectedColumns = <T extends {name: string}>(
    columns: T[],
    storageKey: string,
    columnsTitles: Record<string, string>,
    defaultColumnsIds: string[],
    requiredColumnsIds?: string[],
) => {
    const [selectedColumnsIds, setSelectedColumnsIds] = React.useState<string[]>(() => {
        return settingsManager.readUserSettingsValue(storageKey, defaultColumnsIds) as string[];
    });

    const columnsToShow = React.useMemo(() => {
        return columns.filter((column) => selectedColumnsIds.find((name) => name === column.name));
    }, [columns, selectedColumnsIds]);

    const columnsToSelect: TableColumnSetupItem[] = React.useMemo(() => {
        const columnsIds = columns.map((column) => column.name);

        return columnsIds.map((id) => {
            const isRequired = requiredColumnsIds?.includes(id);
            const isSelected = selectedColumnsIds.includes(id);

            return {
                id,
                title: columnsTitles[id],
                selected: isRequired || isSelected,
                required: isRequired,
                sticky: isRequired ? 'start' : undefined,
            };
        });
    }, [columns, columnsTitles, requiredColumnsIds, selectedColumnsIds]);

    const setColumns: TableColumnSetupProps['onUpdate'] = React.useCallback(
        (value) => {
            const selectedColumns = value.filter((el) => el.selected).map((el) => el.id);

            settingsManager.setUserSettingsValue(storageKey, selectedColumns);
            setSelectedColumnsIds(selectedColumns);
        },
        [storageKey],
    );

    return {
        columnsToShow,
        columnsToSelect,
        setColumns,
    };
};
