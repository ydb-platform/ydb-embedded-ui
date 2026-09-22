import {CircleQuestionFill} from '@gravity-ui/icons';

import {NOT_AVAILABLE_SEVERITY} from './constants';
import type {BaseDiskDisplayState} from './displayState';
import {formatPDiskType} from './getPDiskType';
import type {PDiskType, PreparedPDisk} from './types';

export function getDriveTypeDisplayState(pDisk: PreparedPDisk = {}): BaseDiskDisplayState {
    const hasWhiteboardData = pDisk.HasWhiteboardData ?? pDisk.WhiteboardSize !== undefined;
    const isNoData = !hasWhiteboardData;
    let driveType: PDiskType | undefined;
    if (hasWhiteboardData) {
        switch (pDisk.Type) {
            case 'SSD':
            case 'HDD':
            case 'NVME':
                driveType = pDisk.Type;
        }
    }

    return {
        mode: 'driveType',
        driveType,
        severity: NOT_AVAILABLE_SEVERITY,
        icon: isNoData ? undefined : (formatPDiskType(driveType) ?? CircleQuestionFill),
        isNoData,
        borderless: true,
        showNoDataPlaceholder: isNoData,
    };
}
