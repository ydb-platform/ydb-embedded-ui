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
    test('Should preserve missing latency fields as absent', () => {
        const {groups} = prepareGroupsResponse({StorageGroups: [{GroupId: '1'}]});

        expect(groups?.[0]).toEqual(
            expect.objectContaining({
                LatencyPutTabletLogMs: undefined,
                LatencyPutUserDataMs: undefined,
                LatencyGetFastMs: undefined,
            }),
        );
    });

    test.each(
        [
            undefined,
            null,
            '',
            '   ',
            'invalid',
            '123us',
            NaN,
            Infinity,
            -Infinity,
            'Infinity',
            -1,
            '-1',
            true,
            false,
            [],
            [0],
            {},
        ].map((value) => ({value})),
    )('Should preserve invalid latency $value as absent', ({value}) => {
        const {groups} = prepareGroupsResponse({
            StorageGroups: [
                {
                    GroupId: '1',
                    LatencyPutTabletLog: value as string,
                    LatencyPutUserData: value as string,
                    LatencyGetFast: value as string,
                },
            ],
        });

        expect(groups?.[0]).toEqual(
            expect.objectContaining({
                LatencyPutTabletLogMs: undefined,
                LatencyPutUserDataMs: undefined,
                LatencyGetFastMs: undefined,
            }),
        );
    });

    test.each([
        {value: '0', expected: 0},
        {value: 0, expected: 0},
        {value: '499', expected: 0},
        {value: '500', expected: 1},
        {value: '1000', expected: 1},
        {value: '2500', expected: 3},
        {value: 2500, expected: 3},
    ])('Should convert latency $value to $expected ms', ({value, expected}) => {
        const {groups} = prepareGroupsResponse({
            StorageGroups: [
                {
                    GroupId: '1',
                    LatencyPutTabletLog: value as string,
                    LatencyPutUserData: value as string,
                    LatencyGetFast: value as string,
                },
            ],
        });

        expect(groups?.[0]).toEqual(
            expect.objectContaining({
                LatencyPutTabletLogMs: expected,
                LatencyPutUserDataMs: expected,
                LatencyGetFastMs: expected,
            }),
        );
    });

    test('Should normalize each latency field independently', () => {
        const {groups} = prepareGroupsResponse({
            StorageGroups: [
                {
                    GroupId: '1',
                    LatencyPutUserData: '0',
                    LatencyGetFast: '2500',
                },
            ],
        });

        expect(groups?.[0]).toEqual(
            expect.objectContaining({
                LatencyPutTabletLogMs: undefined,
                LatencyPutUserDataMs: 0,
                LatencyGetFastMs: 3,
            }),
        );
    });

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
