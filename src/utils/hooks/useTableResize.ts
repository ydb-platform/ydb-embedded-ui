import React from 'react';

import type {ColumnWidthByName, HandleResize} from '@gravity-ui/react-data-table';
import {debounce} from 'lodash';

import {useSetting} from '../../store/reducers/settings/useSetting';

export const useTableResize = (
    localStorageKey?: string,
): [ColumnWidthByName, HandleResize, boolean] => {
    const {
        value: sizes,
        saveValue: saveSizes,
        isLoading,
    } = useSetting<ColumnWidthByName>(localStorageKey);

    const debouncedSaveSizes = React.useMemo(
        () =>
            debounce((newSizes: ColumnWidthByName) => {
                saveSizes(newSizes);
            }, 300),
        [saveSizes],
    );

    // Call debounced func on component unmount
    React.useEffect(() => {
        return () => debouncedSaveSizes.flush();
    }, [debouncedSaveSizes]);

    const [actualSizes, setActualSizes] = React.useState(() => {
        return sizes ?? ({} as ColumnWidthByName);
    });

    React.useEffect(() => {
        setActualSizes(sizes ?? {});
    }, [sizes]);

    const handleSetupChange: HandleResize = React.useCallback(
        (columnId, columnWidth) => {
            setActualSizes((previousSetup) => {
                const setup = {
                    ...previousSetup,
                    [columnId]: columnWidth,
                };
                debouncedSaveSizes(setup);
                return setup;
            });
        },
        [debouncedSaveSizes],
    );

    return [actualSizes, handleSetupChange, isLoading];
};
