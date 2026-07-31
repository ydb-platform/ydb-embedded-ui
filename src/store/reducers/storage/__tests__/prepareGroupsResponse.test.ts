import {ECapacityAlert} from '../../../../types/api/enums';
import type {StorageGroupsResponse} from '../../../../types/api/storage';
import type {TVDiskStateInfo} from '../../../../types/api/vdisk';
import {prepareGroupsResponse} from '../utils';

const vDiskWithCapacityMetrics = {
    VDiskId: {
        GroupID: 0,
        GroupGeneration: 0,
        Ring: 0,
        Domain: 0,
        VDisk: 0,
    },
    GroupSizeInUnits: 0,
    VDiskSlotUsage: 82.25,
    VDiskRawUsage: 64.5,
    NormalizedOccupancy: 0.92,
    CapacityAlert: ECapacityAlert.LIGHTYELLOW,
} satisfies TVDiskStateInfo;

describe('prepareGroupsResponse', () => {
    test('Should preserve group and VDisk capacity metrics including zero values', () => {
        const response = {
            StorageGroups: [
                {
                    GroupId: '1',
                    Used: '0',
                    Limit: '1',
                    Read: '0',
                    Write: '0',
                    GroupSizeInUnits: 0,
                    MaxPDiskUsage: 0,
                    MaxVDiskSlotUsage: 0,
                    MaxVDiskRawUsage: 0,
                    VDisks: [{Whiteboard: vDiskWithCapacityMetrics}],
                },
            ],
        } satisfies StorageGroupsResponse;

        expect(prepareGroupsResponse(response).groups?.[0]).toEqual(
            expect.objectContaining({
                GroupSizeInUnits: 0,
                MaxPDiskUsage: 0,
                MaxVDiskSlotUsage: 0,
                MaxVDiskRawUsage: 0,
            }),
        );
        expect(prepareGroupsResponse(response).groups?.[0].VDisks?.[0]).toEqual(
            expect.objectContaining({
                GroupSizeInUnits: 0,
                VDiskSlotUsage: 82.25,
                VDiskRawUsage: 64.5,
                NormalizedOccupancy: 0.92,
                CapacityAlert: ECapacityAlert.LIGHTYELLOW,
            }),
        );
    });

    test('Should keep invalid aggregate capacity metrics absent', () => {
        const response = {
            StorageGroups: [
                {
                    GroupId: '1',
                    Used: '0',
                    Limit: '1',
                    Read: '0',
                    Write: '0',
                    MaxPDiskUsage: '' as unknown as number,
                    MaxVDiskSlotUsage: ' ' as unknown as number,
                    MaxVDiskRawUsage: -1,
                },
                {
                    GroupId: '2',
                    Used: '0',
                    Limit: '1',
                    Read: '0',
                    Write: '0',
                    MaxPDiskUsage: null as unknown as number,
                },
            ],
        } satisfies StorageGroupsResponse;

        expect(prepareGroupsResponse(response).groups?.[0]).toEqual(
            expect.objectContaining({
                MaxPDiskUsage: undefined,
                MaxVDiskSlotUsage: undefined,
                MaxVDiskRawUsage: undefined,
            }),
        );
        expect(prepareGroupsResponse(response).groups?.[1]).toEqual(
            expect.objectContaining({
                MaxPDiskUsage: undefined,
            }),
        );
    });
});
