import updatePRDescription from '../update-pr-description';
import {generateBundleSizeSection, getBundleInfo} from '../utils/bundle';
import {generateTestChangesSummary} from '../utils/format';
import {getTestStatus, readTestResults} from '../utils/results';
import {compareTests} from '../utils/test';

import type {TestResultsInfo} from './types';

// Mock dependencies
jest.mock('../utils/results', () => ({
    readTestResults: jest.fn(),
    getTestStatus: jest.fn(),
}));
jest.mock('../utils/test');
jest.mock('../utils/format');
jest.mock('../utils/bundle');
jest.mock('fs');

describe('updatePRDescription', () => {
    let mockGithub: {
        rest: {
            pulls: {
                get: jest.Mock;
                update: jest.Mock;
            };
        };
    };
    let mockContext: {
        repo: {
            owner: string;
            repo: string;
        };
        issue: {
            number: number;
        };
    };

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock GitHub API
        mockGithub = {
            rest: {
                pulls: {
                    get: jest.fn(),
                    update: jest.fn(),
                },
            },
        };

        // Mock GitHub context
        mockContext = {
            repo: {
                owner: 'testOwner',
                repo: 'testRepo',
            },
            issue: {
                number: 123,
            },
        };

        // Mock test results
        const mockTestResults: TestResultsInfo = {
            total: 10,
            passed: 8,
            failed: 1,
            flaky: 0,
            skipped: 1,
            tests: [
                {
                    title: 'Test 1',
                    fullTitle: 'Suite > Test 1',
                    status: 'passed',
                    file: 'test.spec.ts',
                    skipped: false,
                },
            ],
        };

        (readTestResults as jest.Mock).mockImplementation(() => mockTestResults);
        (getTestStatus as jest.Mock).mockReturnValue({
            status: '✅ PASSED',
            statusColor: 'green',
        });

        // Mock test comparison
        (compareTests as jest.Mock).mockReturnValue({
            new: ['New Test (test.spec.ts)'],
            skipped: ['Skipped Test (test.spec.ts)'],
            deleted: ['Deleted Test (test.spec.ts)'],
        });

        // Mock summary generation
        (generateTestChangesSummary as jest.Mock).mockReturnValue('Test Changes Summary');

        // Mock bundle info
        (getBundleInfo as jest.Mock).mockReturnValue({
            currentSize: 1024,
            mainSize: 1000,
            diff: 24,
            percent: '2.4',
        });

        (generateBundleSizeSection as jest.Mock).mockReturnValue('Bundle Size Section');

        // Mock PR data
        mockGithub.rest.pulls.get.mockResolvedValue({
            data: {
                body: 'Original PR description',
            },
        });

        mockGithub.rest.pulls.update.mockResolvedValue({});
    });

    test('should read both current and main test results', async () => {
        await updatePRDescription(mockGithub, mockContext);

        expect(readTestResults).toHaveBeenCalledTimes(2);
        expect(readTestResults).toHaveBeenCalledWith('playwright-artifacts/test-results.json');
        expect(readTestResults).toHaveBeenCalledWith('gh-pages/main/test-results.json');
    });

    test('should format CI section with correct table and details', async () => {
        const mockResults: TestResultsInfo = {
            total: 5,
            passed: 3,
            failed: 1,
            flaky: 0,
            skipped: 1,
            tests: [],
        };
        (readTestResults as jest.Mock).mockReturnValue(mockResults);
        (getTestStatus as jest.Mock).mockReturnValue({
            status: '❌ FAILED',
            statusColor: 'red',
        });

        await updatePRDescription(mockGithub, mockContext);

        const updateCall = mockGithub.rest.pulls.update.mock.calls[0][0];
        const body = updateCall.body;

        // Check table format
        expect(body).toContain('| Total | Passed | Failed | Flaky | Skipped |');
        expect(body).toContain('|:-----:|:------:|:------:|:-----:|:-------:|');
        expect(body).toContain('| 5 | 3 | 1 | 0 | 1 |');

        // Check details section
        expect(body).toContain('<details>');
        expect(body).toContain('<summary>ℹ️ CI Information</summary>');
        expect(body).toContain('Test recordings for failed tests are available');
        expect(body).toContain('Bundle size is measured');
        expect(body).toContain('</details>');
    });

    test('should handle PR without existing description', async () => {
        mockGithub.rest.pulls.get.mockResolvedValue({
            data: {
                body: null,
            },
        });

        await updatePRDescription(mockGithub, mockContext);

        expect(mockGithub.rest.pulls.update).toHaveBeenCalled();
        const updateCall = mockGithub.rest.pulls.update.mock.calls[0][0];
        expect(updateCall.body).toContain('## CI Results');
    });

    test('should handle errors in test results', async () => {
        const emptyResults: TestResultsInfo = {
            total: 0,
            passed: 0,
            failed: 0,
            flaky: 0,
            skipped: 0,
            tests: [],
        };

        (readTestResults as jest.Mock).mockReturnValue(emptyResults);
        (getTestStatus as jest.Mock).mockReturnValue({
            status: '✅ PASSED',
            statusColor: 'green',
        });

        await updatePRDescription(mockGithub, mockContext);

        expect(mockGithub.rest.pulls.update).toHaveBeenCalled();
        const updateCall = mockGithub.rest.pulls.update.mock.calls[0][0];
        expect(updateCall.body).toContain('## CI Results');
        expect(updateCall.body).toContain('| 0 | 0 | 0 | 0 | 0 |');
    });

    test('should include report URL in description', async () => {
        await updatePRDescription(mockGithub, mockContext);

        expect(mockGithub.rest.pulls.update).toHaveBeenCalled();
        const updateCall = mockGithub.rest.pulls.update.mock.calls[0][0];
        const expectedUrl = `https://testOwner.github.io/testRepo/123/`;
        expect(updateCall.body).toContain(expectedUrl);
    });

    test('should handle failed tests status color', async () => {
        const failedResults: TestResultsInfo = {
            total: 10,
            passed: 8,
            failed: 2,
            flaky: 0,
            skipped: 0,
            tests: [],
        };

        (readTestResults as jest.Mock).mockReturnValue(failedResults);
        (getTestStatus as jest.Mock).mockReturnValue({
            status: '❌ FAILED',
            statusColor: 'red',
        });

        await updatePRDescription(mockGithub, mockContext);

        expect(mockGithub.rest.pulls.update).toHaveBeenCalled();
        const updateCall = mockGithub.rest.pulls.update.mock.calls[0][0];
        expect(updateCall.body).toContain('color: red');
    });

    test('should handle flaky tests status color', async () => {
        const flakyResults: TestResultsInfo = {
            total: 10,
            passed: 8,
            failed: 0,
            flaky: 2,
            skipped: 0,
            tests: [],
        };

        (readTestResults as jest.Mock).mockReturnValue(flakyResults);
        (getTestStatus as jest.Mock).mockReturnValue({
            status: '⚠️ FLAKY',
            statusColor: 'orange',
        });

        await updatePRDescription(mockGithub, mockContext);

        expect(mockGithub.rest.pulls.update).toHaveBeenCalled();
        const updateCall = mockGithub.rest.pulls.update.mock.calls[0][0];
        expect(updateCall.body).toContain('color: orange');
    });
});
