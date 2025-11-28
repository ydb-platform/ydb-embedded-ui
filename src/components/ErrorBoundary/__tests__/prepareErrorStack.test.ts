import {prepareErrorStack} from '../utils';

describe('prepareErrorStack', () => {
    test('Replace origin in error trace', () => {
        const stack = `TypeError: Cannot read properties of null (reading 'hello')
    at Content (http://localhost:3000/static/js/bundle.js:4728:8)
    at renderWithHooks (http://localhost:3000/static/js/bundle.js:98996:22)
    at mountIndeterminateComponent (http://localhost:3000/static/js/bundle.js:102967:17)
    at beginWork (http://localhost:3000/static/js/bundle.js:104270:20)
    at beginWork$1 (http://localhost:3000/static/js/bundle.js:109229:18)
    at performUnitOfWork (http://localhost:3000/static/js/bundle.js:108499:16)
    at workLoopSync (http://localhost:3000/static/js/bundle.js:108422:9)
    at renderRootSync (http://localhost:3000/static/js/bundle.js:108395:11)
    at recoverFromConcurrentError (http://localhost:3000/static/js/bundle.js:107887:24)
    at performConcurrentWorkOnRoot (http://localhost:3000/static/js/bundle.js:107800:26)`;

        const preparedStack = `TypeError: Cannot read properties of null (reading 'hello')
    at Content (/static/js/bundle.js:4728:8)
    at renderWithHooks (/static/js/bundle.js:98996:22)
    at mountIndeterminateComponent (/static/js/bundle.js:102967:17)
    at beginWork (/static/js/bundle.js:104270:20)
    at beginWork$1 (/static/js/bundle.js:109229:18)
    at performUnitOfWork (/static/js/bundle.js:108499:16)
    at workLoopSync (/static/js/bundle.js:108422:9)
    at renderRootSync (/static/js/bundle.js:108395:11)
    at recoverFromConcurrentError (/static/js/bundle.js:107887:24)
    at performConcurrentWorkOnRoot (/static/js/bundle.js:107800:26)`;

        // localhost:3000 is set in jest-environment jsdom config
        expect(prepareErrorStack(stack, {trim: false, maxLines: undefined})).toBe(preparedStack);
    });

    test('Limit trace to maxLines', () => {
        const stack = `TypeError: Cannot read properties of null (reading 'hello')
    at Content (/static/js/bundle.js:4725:8)
    at renderWithHooks (/static/js/bundle.js:98993:22)
    at mountIndeterminateComponent (/static/js/bundle.js:102964:17)
    at beginWork (/static/js/bundle.js:104267:20)
    at beginWork$1 (/static/js/bundle.js:109226:18)
    at performUnitOfWork (/static/js/bundle.js:108496:16)
    at workLoopSync (/static/js/bundle.js:108419:9)
    at renderRootSync (/static/js/bundle.js:108392:11)
    at recoverFromConcurrentError (/static/js/bundle.js:107884:24)
    at performConcurrentWorkOnRoot (/static/js/bundle.js:107797:26)`;

        const preparedStack = `TypeError: Cannot read properties of null (reading 'hello')
    at Content (/static/js/bundle.js:4725:8)
    at renderWithHooks (/static/js/bundle.js:98993:22)
    at mountIndeterminateComponent (/static/js/bundle.js:102964:17)`;

        expect(prepareErrorStack(stack, {trim: false, maxLines: 3})).toBe(preparedStack);
    });

    test('Trims data if needed', () => {
        const stack = `TypeError: Cannot read properties of null (reading 'hello')
    at Content (/static/js/bundle.js:4725:8)`;
        const preparedStack = `TypeError: Cannot read properties of null (reading 'hello')
at Content (/static/js/bundle.js:4725:8)`;
        expect(prepareErrorStack(stack, {trim: true})).toBe(preparedStack);
    });

    test('Return undefined and undefined', () => {
        expect(prepareErrorStack(undefined)).toBe(undefined);
    });
});
