import React from 'react';

import type {ColumnWidthByName, HandleResize} from '@gravity-ui/react-data-table';

import {useSetting} from '../../store/reducers/settings/useSetting';

export const useTableResize = (
    localStorageKey?: string,
): [ColumnWidthByName, HandleResize, boolean] => {
    const {
        value: sizes,
        saveValue: saveSizes,
        isLoading,
    } = useSetting<ColumnWidthByName>(localStorageKey, {
        debounceTime: 300,
    });

    const [actualSizes, setActualSizes] = React.useState(() => {
        return sizes ?? ({} as ColumnWidthByName);
    });

    React.useEffect(() => {
        setActualSizes(sizes ?? {});
    }, [sizes]);

    const handleSetupChange: HandleResize = React.useCallback(
        (columnId, columnWidth) => {
            setActualSizes((previousSetup) => {
                const setup = Object.assign(Object.assign({}, previousSetup), {
                    [columnId]: columnWidth,
                });
                saveSizes(setup);
                return setup;
            });
        },
        [saveSizes],
    );

    return [actualSizes, handleSetupChange, isLoading];
};
