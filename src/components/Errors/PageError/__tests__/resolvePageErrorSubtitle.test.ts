import type {ErrorDetails} from '../../../../utils/errors/extractErrorDetails';
import {resolvePageErrorSubtitle} from '../utils';

function makeNetworkErrorDetails(overrides?: Partial<ErrorDetails>): ErrorDetails {
    return {
        status: 404,
        statusText: 'Not Found',
        errorCode: 'ERR_NETWORK',
        title: '404 Not Found',
        requestUrl: '/api/test/whoami',
        method: 'GET',
        message: 'Network Error',
        ...overrides,
    };
}

describe('resolvePageErrorSubtitle', () => {
    test('promotes HTTP status to subtitle when custom title overrides the main title', () => {
        const result = resolvePageErrorSubtitle({
            hasTitleOverride: true,
            errorTitle: '404 Not Found',
            resolvedTitleString: 'Custom Error Title',
            subtitle: 'Network Error',
            showSubtitle: true,
            details: makeNetworkErrorDetails(),
        });

        expect(result.resolvedSubtitle).toBe('404 Not Found');
        expect(result.resolvedShowSubtitle).toBe(true);
    });

    test('uses original subtitle when no title override is provided', () => {
        const result = resolvePageErrorSubtitle({
            hasTitleOverride: false,
            errorTitle: '404 Not Found',
            resolvedTitleString: '404 Not Found',
            subtitle: 'Network Error',
            showSubtitle: true,
            details: makeNetworkErrorDetails(),
        });

        expect(result.resolvedSubtitle).toBe('Network Error');
        expect(result.resolvedShowSubtitle).toBe(true);
    });

    test('promotes HTTP status to subtitle for non-ERR_NETWORK errors when title is overridden', () => {
        const result = resolvePageErrorSubtitle({
            hasTitleOverride: true,
            errorTitle: '500 Internal Server Error',
            resolvedTitleString: 'Custom Title',
            subtitle: 'Something went wrong',
            showSubtitle: true,
            details: makeNetworkErrorDetails({errorCode: 'ERR_BAD_RESPONSE', status: 500}),
        });

        expect(result.resolvedSubtitle).toBe('500 Internal Server Error');
        expect(result.resolvedShowSubtitle).toBe(true);
    });

    test('uses original subtitle when details have no status', () => {
        const result = resolvePageErrorSubtitle({
            hasTitleOverride: true,
            errorTitle: 'Network Error',
            resolvedTitleString: 'Custom Title',
            subtitle: 'Network Error',
            showSubtitle: true,
            details: makeNetworkErrorDetails({status: undefined}),
        });

        expect(result.resolvedSubtitle).toBe('Network Error');
        expect(result.resolvedShowSubtitle).toBe(true);
    });

    test('uses original subtitle when errorTitle matches resolvedTitle (no override effect)', () => {
        const result = resolvePageErrorSubtitle({
            hasTitleOverride: true,
            errorTitle: '404 Not Found',
            resolvedTitleString: '404 Not Found',
            subtitle: 'Network Error',
            showSubtitle: true,
            details: makeNetworkErrorDetails(),
        });

        expect(result.resolvedSubtitle).toBe('Network Error');
        expect(result.resolvedShowSubtitle).toBe(true);
    });

    test('returns showSubtitle=false when neither branch activates subtitle', () => {
        const result = resolvePageErrorSubtitle({
            hasTitleOverride: false,
            errorTitle: '500 Internal Server Error',
            resolvedTitleString: '500 Internal Server Error',
            subtitle: undefined,
            showSubtitle: false,
            details: makeNetworkErrorDetails({errorCode: 'ERR_BAD_RESPONSE', status: 500}),
        });

        expect(result.resolvedSubtitle).toBeUndefined();
        expect(result.resolvedShowSubtitle).toBe(false);
    });

    test('handles null details gracefully', () => {
        const result = resolvePageErrorSubtitle({
            hasTitleOverride: true,
            errorTitle: 'Error',
            resolvedTitleString: 'Custom Title',
            subtitle: 'Something failed',
            showSubtitle: true,
            details: null,
        });

        expect(result.resolvedSubtitle).toBe('Something failed');
        expect(result.resolvedShowSubtitle).toBe(true);
    });
});
