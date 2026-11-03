import {parseMetaTenants} from './parseMetaTenants';

test('preserves both partial-source errors without inventing runtime fields', () => {
    const databases = [{Id: 'id', Name: '/db', ControlPlane: {id: 'id'}}];
    const errors = {viewer: 'unavailable', control_plane: 'rejected identity'};
    expect(parseMetaTenants({databases, errors})).toEqual({
        TenantInfo: databases,
        sourceErrors: errors,
    });
    expect(parseMetaTenants({})).toEqual({TenantInfo: undefined, sourceErrors: undefined});
});

test.each([undefined, null, '', '   '])(
    'normalizes absent viewer error %p without marking runtime unavailable',
    (viewer) => {
        expect(parseMetaTenants({errors: {viewer}}).sourceErrors).toBeUndefined();
    },
);

test('normalizes source errors independently and keeps real nonempty messages', () => {
    expect(
        parseMetaTenants({errors: {viewer: null, control_plane: 'CP failed'}}).sourceErrors,
    ).toEqual({viewer: undefined, control_plane: 'CP failed'});
    expect(
        parseMetaTenants({errors: {viewer: 'Viewer failed', control_plane: ''}}).sourceErrors,
    ).toEqual({viewer: 'Viewer failed', control_plane: undefined});
});
