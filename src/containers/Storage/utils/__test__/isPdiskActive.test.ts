import {isPdiskActive} from '../index';

const pDisk = {NodeId: 42, PDiskId: 1000};

describe('isPdiskActive', () => {
    test('keeps a PDisk active without an object context', () => {
        expect(isPdiskActive(pDisk)).toBe(true);
    });

    test('matches the current node', () => {
        expect(isPdiskActive(pDisk, {nodeId: '42'})).toBe(true);
        expect(isPdiskActive(pDisk, {nodeId: '43'})).toBe(false);
    });

    test('matches the current PDisk', () => {
        expect(isPdiskActive(pDisk, {pDiskId: '1000'})).toBe(true);
        expect(isPdiskActive(pDisk, {pDiskId: '1001'})).toBe(false);
    });

    test('requires both identifiers to match in combined context', () => {
        expect(isPdiskActive(pDisk, {nodeId: '42', pDiskId: '1000'})).toBe(true);
        expect(isPdiskActive(pDisk, {nodeId: '43', pDiskId: '1000'})).toBe(false);
    });

    test('ignores group and VDisk slot context', () => {
        expect(isPdiskActive(pDisk, {groupId: '1', vDiskSlotId: '2'})).toBe(true);
    });

    test('keeps incomplete PDisk data active', () => {
        expect(isPdiskActive({}, {nodeId: '42', pDiskId: '1000'})).toBe(true);
    });
});
