import {isTopicsSqlIoOperationsEnabled} from '../topicsSqlIoOperations';

describe('topicsSqlIoOperations utils', () => {
    test('detects enabled topics SQL I/O feature flag', () => {
        expect(
            isTopicsSqlIoOperationsEnabled([
                {Name: 'SomeOtherFlag', Default: true},
                {Name: 'EnableTopicsSqlIoOperations', Default: false, Current: true},
            ]),
        ).toBe(true);

        expect(
            isTopicsSqlIoOperationsEnabled([{Name: 'EnableTopicsSqlIoOperations', Default: true}]),
        ).toBe(true);

        expect(
            isTopicsSqlIoOperationsEnabled([
                {Name: 'EnableTopicsSqlIoOperations', Default: true, Current: false},
            ]),
        ).toBe(false);
    });
});
