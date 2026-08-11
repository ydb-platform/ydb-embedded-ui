import React from 'react';

import {DATA_SEVERITY} from '../../utils/disks/constants';
import type {PDiskDisplayStateGetter} from '../../utils/disks/displayState';
import {getPDiskStateDisplayState} from '../../utils/disks/pdiskState';
import type {DisplaySeverity} from '../../utils/disks/types';

import {PDisksGroupBy} from './StorageExpertModePanel/constants';
import {useIsStorageExpertMode, usePDisksGroupByParam} from './useStorageQueryParams';

export function useStoragePDiskDisplayStateGetter(): PDiskDisplayStateGetter {
    const isExpertMode = useIsStorageExpertMode();
    const pdisksGroupBy = usePDisksGroupByParam();

    return React.useCallback(
        (pDisk) => {
            if (!isExpertMode || pdisksGroupBy !== PDisksGroupBy.State) {
                return {
                    severity: (pDisk.Severity ?? DATA_SEVERITY.GREY) as DisplaySeverity,
                    icon: undefined,
                    modeModifier: undefined,
                    isLegendInactive: false,
                };
            }

            return {
                ...getPDiskStateDisplayState(pDisk.State),
                modeModifier: 'mode-state',
                isLegendInactive: false,
                showNoDataPlaceholder: true,
            };
        },
        [isExpertMode, pdisksGroupBy],
    );
}
