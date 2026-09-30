import {SYS_VIEW_TYPE_IDS} from '../../types/api/schema/sysView';
import {prepareSystemViewType} from '../schema';

describe('prepareSystemViewType', () => {
    test('strips the E prefix from enum names returned by YDB <= 26.3.1.x', () => {
        expect(prepareSystemViewType('EVSlots')).toBe('VSlots');
        expect(prepareSystemViewType('EPartitionStats')).toBe('PartitionStats');
    });

    test('maps numeric ESysViewType values returned by newer YDB to names', () => {
        expect(prepareSystemViewType(13)).toBe('VSlots');
        expect(prepareSystemViewType(1)).toBe('PartitionStats');
        expect(prepareSystemViewType(47)).toBe('UdfModules');
    });

    test('falls back to the raw value for numbers unknown to the UI', () => {
        expect(prepareSystemViewType(9999)).toBe('9999');
        expect(prepareSystemViewType(0)).toBe('0');
    });

    test('returns undefined for missing values', () => {
        expect(prepareSystemViewType(undefined)).toBeUndefined();
        expect(prepareSystemViewType(null)).toBeUndefined();
        expect(prepareSystemViewType('')).toBeUndefined();
    });

    test('keeps strings without the E prefix unchanged', () => {
        expect(prepareSystemViewType('CustomView')).toBe('CustomView');
    });
});

describe('SYS_VIEW_TYPE_IDS', () => {
    test('ids are unique', () => {
        const ids = Object.values(SYS_VIEW_TYPE_IDS);
        expect(new Set(ids).size).toBe(ids.length);
    });
});
