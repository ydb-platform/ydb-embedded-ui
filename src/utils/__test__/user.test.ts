import {getUserInfo} from '../user';

describe('getUserInfo', () => {
    test('keeps login authentication behavior unchanged', () => {
        expect(getUserInfo({AuthType: 'Login', UserSID: 'root'})).toEqual({
            login: 'root',
            isSso: false,
        });
    });

    test('removes the @sso suffix for ExternalIdp authentication', () => {
        expect(getUserInfo({AuthType: 'ExternalIdp', UserSID: 'alice@example.com@sso'})).toEqual({
            login: 'alice@example.com',
            isSso: true,
        });
    });

    test('keeps an ExternalIdp email without the @sso suffix unchanged', () => {
        expect(getUserInfo({AuthType: 'ExternalIdp', UserSID: 'alice@example.com'})).toEqual({
            login: 'alice@example.com',
            isSso: true,
        });
    });

    test('keeps an ExternalIdp SID without a suffix unchanged', () => {
        expect(getUserInfo({AuthType: 'ExternalIdp', UserSID: 'alice'})).toEqual({
            login: 'alice',
            isSso: true,
        });
    });

    test('does not expose unsupported or incomplete authentication data', () => {
        expect(getUserInfo({AuthType: 'AccessService', UserSID: 'alice'})).toBeUndefined();
        expect(getUserInfo({AuthType: 'ExternalIdp'})).toBeUndefined();
    });
});
