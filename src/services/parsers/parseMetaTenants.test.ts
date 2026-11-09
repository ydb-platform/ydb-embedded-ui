import {parseMetaTenants} from './parseMetaTenants';

describe('parseMetaTenants', () => {
    test('preserves errors when meta returns no databases', () => {
        expect(
            parseMetaTenants({
                errors: {control_plane: 'Control plane unavailable'},
            }),
        ).toEqual({
            TenantInfo: undefined,
            errors: {control_plane: 'Control plane unavailable'},
        });
    });

    test('keeps responses without errors compatible', () => {
        expect(parseMetaTenants({databases: [{Name: '/local/database'}]})).toEqual({
            TenantInfo: [{Name: '/local/database'}],
        });
    });
});
