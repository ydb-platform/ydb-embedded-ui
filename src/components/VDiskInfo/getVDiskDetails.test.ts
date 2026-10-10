import {EMPTY_DATA_PLACEHOLDER, UNBREAKABLE_GAP} from '../../utils/constants';

import {getVDiskIdentityItems, getVDiskThroughputItems} from './getVDiskDetails';

describe('VDisk detail items', () => {
    test('formats nonzero throughput with two decimal places and preserves zero', () => {
        const items = getVDiskThroughputItems({ReadThroughput: '1000000', WriteThroughput: '0'});
        expect(items.map(({content}) => content)).toEqual([
            `1.00${UNBREAKABLE_GAP}MB/s`,
            `0${UNBREAKABLE_GAP}MB/s`,
        ]);
    });

    test.each([undefined, '', '-1', 'invalid', 'Infinity'])(
        'keeps invalid throughput %p empty',
        (value) => {
            expect(getVDiskThroughputItems({ReadThroughput: value})[0].content).toBe(
                EMPTY_DATA_PLACEHOLDER,
            );
        },
    );

    test('copies exact GUIDs without adding copy buttons for absent values or Kind', () => {
        const data = {Kind: '0', Guid: '18446744073709551615', InstanceGuid: ''};
        const items = getVDiskIdentityItems(data, {
            copyFields: ['guid', 'incarnation-guid', 'instance-guid'],
        });
        expect(items.find(({id}) => id === 'guid')?.copyText).toBe(data.Guid);
        expect(items.find(({id}) => id === 'kind')?.copyText).toBeUndefined();
        expect(items.find(({id}) => id === 'incarnation-guid')?.copyText).toBeUndefined();
        expect(items.find(({id}) => id === 'instance-guid')?.copyText).toBeUndefined();
        expect(getVDiskIdentityItems(data).every(({copyText}) => copyText === undefined)).toBe(
            true,
        );
    });

    test('copies only explicitly selected fields, including Kind', () => {
        const items = getVDiskIdentityItems(
            {Kind: '0', Guid: '123', IncarnationGuid: '456', InstanceGuid: '789'},
            {copyFields: ['kind', 'incarnation-guid']},
        );

        expect(items.filter(({copyText}) => copyText !== undefined)).toMatchObject([
            {id: 'kind', copyText: '0'},
            {id: 'incarnation-guid', copyText: '456'},
        ]);
    });
});
