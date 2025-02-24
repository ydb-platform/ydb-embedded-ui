import {generateBundleSizeSection, getBundleInfo} from '../utils/bundle';

describe('bundle utils', () => {
    describe('generateBundleSizeSection', () => {
        test('should generate section for increased bundle size', () => {
            const bundleInfo = {
                currentSize: 1024 * 1024 * 2, // 2MB
                mainSize: 1024 * 1024, // 1MB
                diff: 1024 * 1024, // 1MB increase
                percent: '100',
            };

            const result = generateBundleSizeSection(bundleInfo);
            expect(result).toContain('Bundle Size: 🔺');
            expect(result).toContain('Current: 2.00 MB | Main: 1.00 MB');
            expect(result).toContain('Diff: +1.00 MB (100%)');
            expect(result).toContain('⚠️ Bundle size increased. Please review.');
        });

        test('should generate section for decreased bundle size', () => {
            const bundleInfo = {
                currentSize: 1024 * 1024, // 1MB
                mainSize: 1024 * 1024 * 2, // 2MB
                diff: -1024 * 1024, // 1MB decrease
                percent: '-50',
            };

            const result = generateBundleSizeSection(bundleInfo);
            expect(result).toContain('Bundle Size: 🔽');
            expect(result).toContain('Current: 1.00 MB | Main: 2.00 MB');
            expect(result).toContain('Diff: 1.00 MB (-50%)');
            expect(result).toContain('✅ Bundle size decreased.');
        });

        test('should generate section for unchanged bundle size', () => {
            const bundleInfo = {
                currentSize: 1024 * 1024, // 1MB
                mainSize: 1024 * 1024, // 1MB
                diff: 0,
                percent: '0',
            };

            const result = generateBundleSizeSection(bundleInfo);
            expect(result).toContain('Bundle Size: ✅');
            expect(result).toContain('Current: 1.00 MB | Main: 1.00 MB');
            expect(result).toContain('Diff: 0.00 KB (0%)');
            expect(result).toContain('✅ Bundle size unchanged.');
        });

        test('should handle N/A percent', () => {
            const bundleInfo = {
                currentSize: 1024 * 1024, // 1MB
                mainSize: 0,
                diff: 1024 * 1024,
                percent: 'N/A',
            };

            const result = generateBundleSizeSection(bundleInfo);
            expect(result).toContain('Bundle Size: ⚠️');
            expect(result).toContain('Current: 1.00 MB | Main: 0.00 KB');
            expect(result).toContain('Diff: +1.00 MB (N/A)');
            expect(result).toContain('⚠️ Unable to calculate change.');
        });
    });

    describe('getBundleInfo', () => {
        const originalEnv = process.env;

        beforeEach(() => {
            jest.resetModules();
            process.env = {...originalEnv};
        });

        afterAll(() => {
            process.env = originalEnv;
        });

        test('should get bundle info from environment variables', () => {
            process.env.CURRENT_SIZE = '2097152'; // 2MB
            process.env.MAIN_SIZE = '1048576'; // 1MB
            process.env.SIZE_DIFF = '1048576'; // 1MB
            process.env.SIZE_PERCENT = '100';

            const result = getBundleInfo();
            expect(result).toEqual({
                currentSize: 2097152,
                mainSize: 1048576,
                diff: 1048576,
                percent: '100',
            });
        });

        test('should handle missing environment variables', () => {
            process.env.CURRENT_SIZE = undefined;
            process.env.MAIN_SIZE = undefined;
            process.env.SIZE_DIFF = undefined;
            process.env.SIZE_PERCENT = undefined;

            const result = getBundleInfo();
            expect(result).toEqual({
                currentSize: 0,
                mainSize: 0,
                diff: 0,
                percent: 'N/A',
            });
        });
    });
});
