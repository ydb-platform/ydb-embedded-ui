import {getSsoReturnTo} from '../utils';

describe('getSsoReturnTo', () => {
    test('falls back when the implicit current path is not a safe local path', () => {
        const fallbackPath = '/ui/home';

        expect(
            getSsoReturnTo({
                currentUrl: new URL('https://trusted-host//attacker.example'),
                fallbackPath,
                isDirectAuthPage: false,
                returnUrl: undefined,
            }),
        ).toBe(fallbackPath);
    });
});
