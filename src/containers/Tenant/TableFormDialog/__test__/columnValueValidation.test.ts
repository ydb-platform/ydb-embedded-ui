import {isValueForTypeValid} from '../columnValueValidation';

describe('columnValueValidation', () => {
    test.each([
        ['Date', '2025-00-01'],
        ['Date', '2025-01-00'],
        ['Date', '2025-02-29'],
        ['Date', '2025-04-31'],
        ['Date', '1969-12-31'],
        ['Date', '2107-01-01'],
        ['Date32', '2025-00-01'],
        ['Date32', '2025-01-00'],
        ['Date32', '2025-02-29'],
        ['Date32', '2025-04-31'],
        ['Datetime', '2025-00-01T00:00:00Z'],
        ['Datetime', '2025-01-00T00:00:00Z'],
        ['Datetime', '2025-02-31T00:00:00Z'],
        ['Datetime', '2025-01-01T24:00:00Z'],
        ['Datetime', '2025-01-01T23:60:00Z'],
        ['Datetime', '2025-01-01T23:59:60Z'],
        ['Datetime', '1969-12-31T23:59:59Z'],
        ['Datetime', '2107-01-01T00:00:00Z'],
        ['Datetime64', '2025-00-01T00:00:00Z'],
        ['Datetime64', '2025-01-00T00:00:00Z'],
        ['Datetime64', '2025-02-31T00:00:00Z'],
        ['Datetime64', '2025-01-01T24:00:00Z'],
        ['Timestamp', '2025-00-01T00:00:00.000001Z'],
        ['Timestamp', '2025-01-00T00:00:00.000001Z'],
        ['Timestamp', '2025-02-31T00:00:00.000001Z'],
        ['Timestamp', '2025-01-01T24:00:00.000001Z'],
        ['Timestamp', '2025-01-01T23:60:00.000001Z'],
        ['Timestamp', '2025-01-01T23:59:60.000001Z'],
        ['Timestamp', '1969-12-31T23:59:59.000001Z'],
        ['Timestamp', '2107-01-01T00:00:00.000001Z'],
        ['Timestamp64', '2025-00-01T00:00:00.000001Z'],
        ['Timestamp64', '2025-01-00T00:00:00.000001Z'],
        ['Timestamp64', '2025-02-31T00:00:00.000001Z'],
        ['Timestamp64', '2025-01-01T24:00:00.000001Z'],
    ])('rejects invalid %s values', (type, value) => {
        expect(isValueForTypeValid(value, type)).toBe(false);
    });

    test.each([
        ['Date', '2025-01-02'],
        ['Date', '2024-02-29'],
        ['Date', '1970-01-01'],
        ['Date', '2106-01-01'],
        ['Date32', '2025-01-02'],
        ['Date32', '2024-02-29'],
        ['Datetime', '2025-01-02T03:04:05Z'],
        ['Datetime', '2024-02-29T03:04:05Z'],
        ['Datetime', '1970-01-01T00:00:00Z'],
        ['Datetime', '2106-01-01T00:00:00Z'],
        ['Datetime64', '2025-01-02T03:04:05Z'],
        ['Datetime64', '2024-02-29T03:04:05Z'],
        ['Timestamp', '2025-01-02T03:04:05.000001Z'],
        ['Timestamp', '2024-02-29T03:04:05.000001Z'],
        ['Timestamp', '1970-01-01T00:00:00.000001Z'],
        ['Timestamp', '2106-01-01T00:00:00.000001Z'],
        ['Timestamp64', '2025-01-02T03:04:05.000001Z'],
        ['Timestamp64', '2024-02-29T03:04:05.000001Z'],
    ])('keeps accepting valid %s values', (type, value) => {
        expect(isValueForTypeValid(value, type)).toBe(true);
    });
});
