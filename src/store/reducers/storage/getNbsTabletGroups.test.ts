import {getTabletGroups} from './getNbsTabletGroups';

const id = (node: number) => ({NodeId: node, PDiskId: 1, DDiskSlotId: 1010});
test('uses inline slot details and authoritative health without a disk inventory request', async () => {
    const signal = new AbortController().signal;
    const group = {
        DirectBlockGroupId: 0,
        DDiskId: [id(1)],
        PersistentBufferDDiskId: [id(2)],
        DDiskHealth: [{Status: 'Ready'}],
        PersistentBufferHealth: [{Status: 'Broken', Reason: 'I/O error'}],
        UnavailableDDiskCount: 0,
        UnavailablePersistentBufferCount: 1,
        MonitoredQuorum: 'NoQuorum',
    };
    const slots = [
        {...id(1), DDiskPath: 'actors/ddisks/ddisk_p000000001_s000001010'},
        {...id(2), AllocatedSize: '1000', PersistentBufferId: '[2:5893148750:1010]'},
    ];
    const getNbsTablet = jest.fn().mockResolvedValue({Status: 'OK', Groups: [group], Slots: slots});
    const getNbsStorage = jest.fn();
    const oldApi = window.api;
    window.api = {storage: {getNbsTablet, getNbsStorage}} as unknown as typeof window.api;
    try {
        const result = await getTabletGroups('18446744073709551615', signal);
        expect(result).toEqual({groups: [group], slots});
        expect(getNbsTablet).toHaveBeenCalledWith('18446744073709551615', {signal});
        expect(getNbsStorage).not.toHaveBeenCalled();
    } finally {
        window.api = oldApi;
    }
});
