import {CAPACITY_METRICS_HELP_TEXT} from '../constants';

describe('capacityMetricsColumns constants', () => {
    test('defines exact denominator help for every capacity metric', () => {
        expect(CAPACITY_METRICS_HELP_TEXT).toEqual({
            MaxPDiskUsage:
                'Occupied shared-quota chunks divided by chunks available to all VDisks on the PDisk.',
            MaxVDiskSlotUsage:
                'VDisk allocated chunks relative to its slot hard limit at the yellow-move threshold.',
            MaxVDiskRawUsage: 'VDisk allocated chunks relative to its raw fair-part quota.',
            MaxNormalizedOccupancy:
                'Internal nonlinear occupancy in the 0..1 range; this value is not a percentage.',
            CapacityAlert: 'Backend capacity alert enum, not a percentage derived in the UI.',
        });
    });
});
