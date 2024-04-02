import type {Column} from '@gravity-ui/react-data-table';
import type {TableColumnSetupItem, TableColumnSetupProps} from '@gravity-ui/uikit';

import {useSetting} from '../../utils/hooks';

export const useSelectedColumns = <T>(
    columns: Column<T>[],
    storageKey: string,
    columnsTitles: Record<string, string>,
    defaultColumnsIds: string[],
    requiredColumnsIds?: string[],
) => {
    const [selectedColumnsIds, setSelectedColumnsIds] = useSetting<string[]>(
        storageKey,
        defaultColumnsIds,
    );

    const columnsIds = columns.map((column) => column.name);

    const columnsToShow = columns.filter((column) =>
        selectedColumnsIds.find((name) => name === column.name),
    );

    const columnsToSelect: TableColumnSetupItem[] = columnsIds.map((id) => {
        return {
            id,
            title: columnsTitles[id],
            selected: selectedColumnsIds.includes(id),
            required: requiredColumnsIds?.includes(id),
        };
    });

    const setColumns: TableColumnSetupProps['onUpdate'] = (value) => {
        const selectedColumns = value.filter((el) => el.isSelected).map((el) => el.id);

        setSelectedColumnsIds(selectedColumns);
    };

    return {
        columnsToShow,
        columnsToSelect,
        setColumns,
    };
};
