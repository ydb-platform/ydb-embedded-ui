import React from 'react';

import {isCapacityAlert} from '../../types/api/enums';
import {DATA_SEVERITY} from '../../utils/disks/constants';
import type {PDiskDisplayStateGetter} from '../../utils/disks/displayState';
import {calculateSpaceIcon} from '../../utils/disks/iconCalculators';
import {getPDiskStateDisplayState} from '../../utils/disks/pdiskState';
import {calculateSpaceSeverity} from '../../utils/disks/severityCalculators';
import type {DisplaySeverity} from '../../utils/disks/types';

import {useSpaceLegendSelection} from './StorageExpertModePanel/components/useSpaceLegendSelection';
import {PDisksGroupBy} from './StorageExpertModePanel/constants';
import i18n from './StorageExpertModePanel/i18n';
import {useIsStorageExpertMode, usePDisksGroupByParam} from './useStorageQueryParams';

export function useStoragePDiskDisplayStateGetter(): PDiskDisplayStateGetter {
    const isExpertMode = useIsStorageExpertMode();
    const pdisksGroupBy = usePDisksGroupByParam();
    const inactiveAlerts = useSpaceLegendSelection('pdisks');

    return React.useCallback(
        (pDisk) => {
            if (!isExpertMode) {
                return {
                    severity: (pDisk.Severity ?? DATA_SEVERITY.GREY) as DisplaySeverity,
                    icon: undefined,
                    modeModifier: undefined,
                    isLegendInactive: false,
                };
            }

            if (pdisksGroupBy === PDisksGroupBy.Space) {
                const capacityAlert = pDisk.PDiskCapacityAlert;

                return {
                    severity: calculateSpaceSeverity({CapacityAlert: capacityAlert}),
                    icon:
                        pDisk.State === undefined
                            ? i18n('value_no-data')
                            : calculateSpaceIcon({CapacityAlert: capacityAlert}),
                    modeModifier: 'mode-space',
                    isLegendInactive:
                        isCapacityAlert(capacityAlert) && inactiveAlerts.has(capacityAlert),
                    showNoDataPlaceholder: false,
                };
            }

            if (pdisksGroupBy !== PDisksGroupBy.State) {
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
        [inactiveAlerts, isExpertMode, pdisksGroupBy],
    );
}
