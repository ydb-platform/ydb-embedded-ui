import {managePartitioningSchema} from '../utils';

describe('managePartitioningSchema', () => {
    test('allows submitting without split size when split-by-size is disabled', () => {
        const result = managePartitioningSchema().safeParse({
            splitSizeEnabled: false,
            splitSize: '',
            splitUnit: 'gb',
            loadEnabled: true,
            minimum: '10',
            maximum: '20',
        });

        expect(result.success).toBe(true);
    });

    test('requires split size when split-by-size is enabled', () => {
        const result = managePartitioningSchema().safeParse({
            splitSizeEnabled: true,
            splitSize: '',
            splitUnit: 'gb',
            loadEnabled: true,
            minimum: '10',
            maximum: '20',
        });

        expect(result.success).toBe(false);
        expect(result.error?.flatten().fieldErrors.splitSize).toBeTruthy();
    });
});
