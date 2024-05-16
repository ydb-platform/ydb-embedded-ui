import React from 'react';

import type {
    ColumnWidthByName,
    GetSavedColumnWidthByName,
    HandleResize,
    SaveColumnWidthByName,
} from '@gravity-ui/react-data-table';
import {useTableResize as libUseTableResize} from '@gravity-ui/react-data-table';

import {settingsManager} from '../../services/settings';

export const useTableResize = (localStorageKey?: string): [ColumnWidthByName, HandleResize] => {
    const getSizes: GetSavedColumnWidthByName = React.useCallback(() => {
        if (!localStorageKey) {
            return {};
        }
        return settingsManager.readUserSettingsValue(localStorageKey, {}) as ColumnWidthByName;
    }, [localStorageKey]);

    const saveSizes: SaveColumnWidthByName = React.useCallback(
        (value) => {
            if (localStorageKey) {
                settingsManager.setUserSettingsValue(localStorageKey, value);
            }
        },
        [localStorageKey],
    );

    return libUseTableResize({saveSizes, getSizes});
};
