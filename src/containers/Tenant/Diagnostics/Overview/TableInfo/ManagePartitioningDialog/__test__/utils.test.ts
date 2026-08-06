import i18n from '../i18n';
import {managePartitioningSchema} from '../utils';

const VALID_VALUES = {
    splitSize: '3',
    splitUnit: 'gb' as const,
    loadEnabled: true,
    minimum: '1',
    maximum: '10',
};

describe('managePartitioningSchema', () => {
    test('accepts a Split Size above 2 GiB when the maximum is unavailable', () => {
        expect(managePartitioningSchema(undefined).safeParse(VALID_VALUES).success).toBe(true);
    });

    test('rejects a Split Size above a configured maximum', () => {
        const result = managePartitioningSchema(2_147_483_648).safeParse(VALID_VALUES);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: ['splitSize'],
                        message: i18n('error_value-greater-maximum'),
                    }),
                ]),
            );
        }
    });

    test('does not impose an upper bound on Maximum partition count', () => {
        const result = managePartitioningSchema(4_000_000_000).safeParse({
            ...VALID_VALUES,
            splitSize: '1',
            maximum: '999999999',
        });

        expect(result.success).toBe(true);
    });
});
