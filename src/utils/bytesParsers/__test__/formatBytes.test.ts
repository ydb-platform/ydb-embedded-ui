import {unbreakableGap} from '../../utils';
import {formatBytes} from '../formatBytes';

describe('formatBytes', () => {
    it('should work with only value', () => {
        expect(formatBytes({value: 100})).toBe(`100${unbreakableGap}B`);
        expect(formatBytes({value: 100_000})).toBe(`100${unbreakableGap}KB`);
        expect(formatBytes({value: 100_000_000})).toBe(`100${unbreakableGap}MB`);
        expect(formatBytes({value: 100_000_000_000})).toBe(`100${unbreakableGap}GB`);
        expect(formatBytes({value: 100_000_000_000_000})).toBe(`100${unbreakableGap}TB`);
    });
    it('should convert to size', () => {
        expect(formatBytes({value: 100_000, size: 'b'})).toBe(
            `100${unbreakableGap}000${unbreakableGap}B`,
        );
        expect(formatBytes({value: 100_000_000_000_000, size: 'gb'})).toBe(
            `100${unbreakableGap}000${unbreakableGap}GB`,
        );
    });
    it('should convert without labels', () => {
        expect(formatBytes({value: 100_000, size: 'b', withSizeLabel: false})).toBe(
            `100${unbreakableGap}000`,
        );
        expect(formatBytes({value: 100_000_000_000_000, size: 'gb', withSizeLabel: false})).toBe(
            `100${unbreakableGap}000`,
        );
    });
    it('should convert to speed', () => {
        expect(formatBytes({value: 100_000, withSpeedLabel: true})).toBe(
            `100${unbreakableGap}KB/s`,
        );
        expect(formatBytes({value: 100_000, size: 'b', withSpeedLabel: true})).toBe(
            `100${unbreakableGap}000${unbreakableGap}B/s`,
        );
    });
    it('should return fixed amount of significant digits', () => {
        expect(formatBytes({value: 99_000, significantDigits: 2})).toEqual(
            `99${unbreakableGap}000${unbreakableGap}B`,
        );
        expect(formatBytes({value: 100_000, significantDigits: 2})).toEqual(
            `100${unbreakableGap}KB`,
        );
        expect(formatBytes({value: 99_000_000_000_000, significantDigits: 2})).toEqual(
            `99${unbreakableGap}000${unbreakableGap}GB`,
        );
        expect(formatBytes({value: 100_000_000_000_000, significantDigits: 2})).toEqual(
            `100${unbreakableGap}TB`,
        );
    });
    it('should return empty string on invalid data', () => {
        expect(formatBytes({value: undefined})).toEqual('');
        expect(formatBytes({value: null})).toEqual('');
        expect(formatBytes({value: ''})).toEqual('');
        expect(formatBytes({value: 'false'})).toEqual('');
        expect(formatBytes({value: '123qwe'})).toEqual('');
    });
    it('should work with precision', () => {
        expect(formatBytes({value: 123.123, precision: 2})).toBe(`123${unbreakableGap}B`);
        expect(formatBytes({value: 12.123, precision: 2})).toBe(`12${unbreakableGap}B`);
        expect(formatBytes({value: 1.123, precision: 2})).toBe(`1.1${unbreakableGap}B`);
        expect(formatBytes({value: 0.123, precision: 2})).toBe(`0.12${unbreakableGap}B`);
        expect(formatBytes({value: 0.012, precision: 2})).toBe(`0.01${unbreakableGap}B`);
        expect(formatBytes({value: 0.001, precision: 2})).toBe(`0${unbreakableGap}B`);
        expect(formatBytes({value: 0, precision: 2})).toBe(`0${unbreakableGap}B`);
    });
});
