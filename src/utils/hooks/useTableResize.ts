import {useCallback, useState} from 'react';
import type {Column as DataTableColumn} from '@gravity-ui/react-data-table';
import {DEFAULT_RESIZEABLE, type Column as VirtualTableColumn} from '../../components/VirtualTable';
import {settingsManager} from '../../services/settings';

export type Column<T> = VirtualTableColumn<T> & DataTableColumn<T>;

export type TableColumnsWidthSetup = Record<string, number>;

export type HandleTableColumnsResize = (newSetup: TableColumnsWidthSetup) => void;

export const updateColumnsWidth = <T>(
    columns: Column<T>[],
    columnsWidthSetup: TableColumnsWidthSetup,
) => {
    return columns.map((column) => {
        const resizeable = column.resizeable ?? DEFAULT_RESIZEABLE;

        if (!resizeable) {
            return column;
        }
        return {...column, width: columnsWidthSetup[column.name] ?? column.width};
    });
};

export const useTableResize = (
    localStorageKey: string,
): [TableColumnsWidthSetup, HandleTableColumnsResize] => {
    const [tableColumnsWidthSetup, setTableColumnsWidth] = useState<TableColumnsWidthSetup>(() => {
        const setupFromLS = settingsManager.readUserSettingsValue(
            localStorageKey,
            {},
        ) as TableColumnsWidthSetup;

        return setupFromLS;
    });

    const handleSetupChange: HandleTableColumnsResize = useCallback(
        (newSetup) => {
            setTableColumnsWidth((previousSetup) => {
                // ResizeObserver callback may be triggered only for currently resized column
                // or for the whole set of columns
                const setup = {
                    ...previousSetup,
                    ...newSetup,
                };
                settingsManager.setUserSettingsValue(localStorageKey, setup);
                return setup;
            });
        },
        [localStorageKey],
    );

    return [tableColumnsWidthSetup, handleSetupChange];
};
