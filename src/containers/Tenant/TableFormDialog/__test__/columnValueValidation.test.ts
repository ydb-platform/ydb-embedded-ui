import {isValueForTypeValid} from '../columnValueValidation';

describe('columnValueValidation', () => {
    test.each([
        ['Date', '2025-00-01'],
        ['Date', '2025-01-00'],
        ['Date32', '2025-00-01'],
        ['Date32', '2025-01-00'],
        ['Datetime', '2025-00-01T00:00:00Z'],
        ['Datetime', '2025-01-00T00:00:00Z'],
        ['Datetime64', '2025-00-01T00:00:00Z'],
        ['Datetime64', '2025-01-00T00:00:00Z'],
        ['Timestamp', '2025-00-01T00:00:00.000001Z'],
        ['Timestamp', '2025-01-00T00:00:00.000001Z'],
        ['Timestamp64', '2025-00-01T00:00:00.000001Z'],
        ['Timestamp64', '2025-01-00T00:00:00.000001Z'],
    ])('rejects invalid %s values with zero month or day', (type, value) => {
        expect(isValueForTypeValid(value, type)).toBe(false);
    });

    test.each([
        ['Date', '2025-01-02'],
        ['Date32', '2025-01-02'],
        ['Datetime', '2025-01-02T03:04:05Z'],
        ['Datetime64', '2025-01-02T03:04:05Z'],
        ['Timestamp', '2025-01-02T03:04:05.000001Z'],
        ['Timestamp64', '2025-01-02T03:04:05.000001Z'],
    ])('keeps accepting valid %s values', (type, value) => {
        expect(isValueForTypeValid(value, type)).toBe(true);
    });
});
