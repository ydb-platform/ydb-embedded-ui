import {
    formatSize,
    generateTestChangesSummary,
} from '../../../.github/workflows/scripts/utils/format';

describe('format utils', () => {
    describe('formatSize', () => {
        it('should format size in KB when less than 1024 bytes', () => {
            const size = 512; // 512 bytes
            expect(formatSize(size)).toBe('0.50 KB');
        });

        it('should format size in MB when greater than or equal to 1024 bytes', () => {
            const size = 2.5 * 1024; // 2.5 KB -> will be shown in MB
            expect(formatSize(size)).toBe('0.00 MB');
        });

        it('should handle small sizes', () => {
            const size = 100; // 100 bytes
            expect(formatSize(size)).toBe('0.10 KB');
        });

        it('should handle zero', () => {
            expect(formatSize(0)).toBe('0.00 KB');
        });
    });

    describe('generateTestChangesSummary', () => {
        it('should generate summary for new tests only', () => {
            const comparison = {
                new: ['Test 1 (file1.ts)', 'Test 2 (file2.ts)'],
                skipped: [],
                deleted: [],
            };

            const summary = generateTestChangesSummary(comparison);
            expect(summary).toContain('✨ New Tests (2)');
            expect(summary).toContain('1. Test 1 (file1.ts)');
            expect(summary).toContain('2. Test 2 (file2.ts)');
            expect(summary).not.toContain('⏭️ Skipped Tests');
            expect(summary).not.toContain('🗑️ Deleted Tests');
        });

        it('should generate summary for skipped tests only', () => {
            const comparison = {
                new: [],
                skipped: ['Test 1 (file1.ts)', 'Test 2 (file2.ts)'],
                deleted: [],
            };

            const summary = generateTestChangesSummary(comparison);
            expect(summary).toContain('⏭️ Skipped Tests (2)');
            expect(summary).toContain('1. Test 1 (file1.ts)');
            expect(summary).toContain('2. Test 2 (file2.ts)');
            expect(summary).not.toContain('✨ New Tests');
            expect(summary).not.toContain('🗑️ Deleted Tests');
        });

        it('should generate summary for deleted tests only', () => {
            const comparison = {
                new: [],
                skipped: [],
                deleted: ['Test 1 (file1.ts)', 'Test 2 (file2.ts)'],
            };

            const summary = generateTestChangesSummary(comparison);
            expect(summary).toContain('🗑️ Deleted Tests (2)');
            expect(summary).toContain('1. Test 1 (file1.ts)');
            expect(summary).toContain('2. Test 2 (file2.ts)');
            expect(summary).not.toContain('✨ New Tests');
            expect(summary).not.toContain('⏭️ Skipped Tests');
        });

        it('should generate summary for all types of changes', () => {
            const comparison = {
                new: ['New Test (file1.ts)'],
                skipped: ['Skipped Test (file2.ts)'],
                deleted: ['Deleted Test (file3.ts)'],
            };

            const summary = generateTestChangesSummary(comparison);
            expect(summary).toContain('✨ New Tests (1)');
            expect(summary).toContain('⏭️ Skipped Tests (1)');
            expect(summary).toContain('🗑️ Deleted Tests (1)');
            expect(summary).toContain('New Test (file1.ts)');
            expect(summary).toContain('Skipped Test (file2.ts)');
            expect(summary).toContain('Deleted Test (file3.ts)');
        });

        it('should handle no changes', () => {
            const comparison = {
                new: [],
                skipped: [],
                deleted: [],
            };

            const summary = generateTestChangesSummary(comparison);
            expect(summary).toBe('😟 No changes in tests. 😕');
        });
    });
});
