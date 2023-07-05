import {formatBytes} from '../formatBytes';

describe('formatBytes', () => {
    it('should work with only value', () => {
        expect(formatBytes({value: 100})).toBe('100 B');
        expect(formatBytes({value: 100_000})).toBe('100 KB');
        expect(formatBytes({value: 100_000_000})).toBe('100 MB');
        expect(formatBytes({value: 100_000_000_000})).toBe('100 GB');
        expect(formatBytes({value: 100_000_000_000_000})).toBe('100 TB');
    });
    it('should convert to size', () => {
        expect(formatBytes({value: 100_000, size: 'b'})).toBe('100,000 B');
        expect(formatBytes({value: 100_000_000_000_000, size: 'gb'})).toBe('100,000 GB');
    });
    it('should convert without labels', () => {
        expect(formatBytes({value: 100_000, size: 'b', withLabel: false})).toBe('100,000');
        expect(formatBytes({value: 100_000_000_000_000, size: 'gb', withLabel: false})).toBe(
            '100,000',
        );
    });
    it('should convert to speed', () => {
        expect(formatBytes({value: 100_000, isSpeed: true})).toBe('100 KB/s');
        expect(formatBytes({value: 100_000, size: 'b', isSpeed: true})).toBe('100,000 B/s');
    });
    it('should return fixed amount of significant digits', () => {
        expect(formatBytes({value: 99_000, significantDigits: 2})).toEqual('99,000 B');
        expect(formatBytes({value: 100_000, significantDigits: 2})).toEqual('100 KB');
        expect(formatBytes({value: 99_000_000_000_000, significantDigits: 2})).toEqual('99,000 GB');
        expect(formatBytes({value: 100_000_000_000_000, significantDigits: 2})).toEqual('100 TB');
    });
});
