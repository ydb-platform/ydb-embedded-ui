import type {PDisksGroupByValue, VDisksGroupByValue} from '../constants';
import {PDisksGroupBy, VDisksGroupBy} from '../constants';

import {AllLegend} from './AllLegend';
import {CompactionLegend} from './CompactionLegend';
import {DriveTypeLegend} from './DriveTypeLegend';
import {FrontQueuesLegend} from './FrontQueuesLegend';
import {PDiskDecommitLegend} from './PDiskDecommitLegend';
import {PDiskDeviceLegend} from './PDiskDeviceLegend';
import {PDiskDriveLegend} from './PDiskDriveLegend';
import {PDiskMaintenanceLegend} from './PDiskMaintenanceLegend';
import {PDiskStateLegend} from './PDiskStateLegend';
import {SpaceLegend} from './SpaceLegend';
import {StateLegend} from './StateLegend';
import type {SpaceLegendSelectionScope} from './getSpaceLegendSelection';

export function renderVDiskLegend(
    vdisksGroupBy: VDisksGroupByValue,
    selectionScope: SpaceLegendSelectionScope,
) {
    switch (vdisksGroupBy) {
        case VDisksGroupBy.DriveType:
            return <DriveTypeLegend />;
        case VDisksGroupBy.State:
            return <StateLegend />;
        case VDisksGroupBy.Space:
            return <SpaceLegend selectionScope={selectionScope} />;
        case VDisksGroupBy.FrontQueues:
            return <FrontQueuesLegend />;
        case VDisksGroupBy.Compaction:
            return <CompactionLegend />;
        case VDisksGroupBy.All:
            return <AllLegend selectionScope={selectionScope} />;
        default:
            return null;
    }
}

export function renderPDiskLegend(
    pdisksGroupBy: PDisksGroupByValue,
    selectionScope: SpaceLegendSelectionScope,
) {
    switch (pdisksGroupBy) {
        case PDisksGroupBy.DriveType:
            return <DriveTypeLegend />;
        case PDisksGroupBy.State:
            return <PDiskStateLegend />;
        case PDisksGroupBy.Space:
            return <SpaceLegend selectionScope={selectionScope} />;
        case PDisksGroupBy.Drive:
            return <PDiskDriveLegend />;
        case PDisksGroupBy.Decommit:
            return <PDiskDecommitLegend />;
        case PDisksGroupBy.Maintenance:
            return <PDiskMaintenanceLegend />;
        case PDisksGroupBy.Device:
            return <PDiskDeviceLegend />;
        case PDisksGroupBy.All:
            return <AllLegend selectionScope={selectionScope} />;
        default:
            return null;
    }
}
