import {resolveOperationQueryState} from '../utils';

describe('resolveOperationQueryState', () => {
    test('waits for analyze capability before falling back to buildindex', () => {
        expect(
            resolveOperationQueryState({
                queryKind: 'analyze',
                analyzeOperationAvailable: false,
                capabilitiesLoaded: false,
            }),
        ).toEqual({
            kind: 'analyze',
            skipQuery: true,
        });
    });

    test('falls back from analyze to buildindex after capabilities load without analyze support', () => {
        expect(
            resolveOperationQueryState({
                queryKind: 'analyze',
                analyzeOperationAvailable: false,
                capabilitiesLoaded: true,
            }),
        ).toEqual({
            kind: 'buildindex',
            skipQuery: false,
        });
    });

    test('keeps analyze after capabilities confirm analyze support', () => {
        expect(
            resolveOperationQueryState({
                queryKind: 'analyze',
                analyzeOperationAvailable: true,
                capabilitiesLoaded: true,
            }),
        ).toEqual({
            kind: 'analyze',
            skipQuery: false,
        });
    });

    test('does not wait for capabilities for other operation kinds', () => {
        expect(
            resolveOperationQueryState({
                queryKind: 'export/s3',
                analyzeOperationAvailable: false,
                capabilitiesLoaded: false,
            }),
        ).toEqual({
            kind: 'export/s3',
            skipQuery: false,
        });
    });
});
