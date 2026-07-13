import type {IconData} from '@gravity-ui/uikit';

import {DATA_SEVERITY} from './constants';
import type {IconWithColor} from './iconCalculators';
import type {DisplaySeverity, PreparedVDisk} from './types';

export interface DiskDisplayState {
    severity: DisplaySeverity;
    icon: IconData | IconWithColor[] | string | undefined;
    modeModifier: string | undefined;
    isLegendInactive?: boolean;
}

export type DiskDisplayStateGetter = (vDisk: PreparedVDisk, isDonor?: boolean) => DiskDisplayState;

export function getDefaultDiskDisplayState(vDisk: PreparedVDisk): DiskDisplayState {
    return {
        severity: (vDisk.Severity ?? DATA_SEVERITY.GREY) as DisplaySeverity,
        icon: undefined,
        modeModifier: undefined,
        isLegendInactive: false,
    };
}
