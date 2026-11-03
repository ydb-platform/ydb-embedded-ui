import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';

import {getControlPlaneExtensions, getControlPlaneTab, prepareControlPlaneInfo} from './utils';

test('CP information preserves canonical path, uses placeholders and retains configured zero', () => {
    const data = prepareControlPlaneInfo({
        Name: '/canonical',
        ControlPlane: {
            name: 'Display',
            endpoint: '',
            scale_policy: {fixed_scale: {size: 0}},
            storage_config: {storage_size_limit: 0},
        },
    });
    expect(data).toMatchObject({
        name: 'Display',
        path: '/canonical',
        endpoint: EMPTY_DATA_PLACEHOLDER,
        size: 0,
        storageLimit: 0,
    });
    expect(prepareControlPlaneInfo({ControlPlane: {name: 'Display'}}).path).toBe(
        EMPTY_DATA_PLACEHOLDER,
    );
});

test('temporary CP tabs tolerate unavailable extensions and runtime deep links', () => {
    expect(getControlPlaneTab('backups', true, false)).toBe('backups');
    expect(getControlPlaneTab('backups', false, false)).toBe('overview');
    expect(getControlPlaneTab('monitoring', true, true)).toBe('monitoring');
    expect(getControlPlaneTab('nodes', true, true)).toBe('overview');
});

test('nullable CP fields from older responses use the same missing-value placeholder', () => {
    const tenant = JSON.parse('{"ControlPlane":{"endpoint":null}}');
    expect(prepareControlPlaneInfo(tenant).endpoint).toBe(EMPTY_DATA_PLACEHOLDER);
});

test('cold CP supports Backups without cluster config but requires actual config for Monitoring', () => {
    const context = {
        tenant: {
            Name: '/folder/db',
            ControlPlane: {id: 'id', name: 'display', folder_id: 'folder'},
        },
        database: 'id',
        clusterName: 'route-cluster',
        backupsRenderer: true,
        monitoringRenderer: true,
    };
    expect(getControlPlaneExtensions({...context, clusterDataLoaded: false})).toEqual({
        hasBackups: true,
        hasMonitoring: false,
    });
    expect(getControlPlaneExtensions({...context, clusterDataLoaded: true})).toEqual({
        hasBackups: true,
        hasMonitoring: true,
    });
    expect(
        getControlPlaneExtensions({
            ...context,
            tenant: {Name: '/folder/db', ControlPlane: {id: 'id'}},
            database: '/folder/db',
            clusterDataLoaded: false,
        }).hasBackups,
    ).toBe(true);
    expect(
        getControlPlaneExtensions({
            ...context,
            tenant: {ControlPlane: {id: 'id'}},
            database: 'id',
            clusterDataLoaded: false,
        }).hasBackups,
    ).toBe(false);
});

test('a CP ID route cannot borrow the canonical Name for the external Backups folder fallback', () => {
    expect(
        getControlPlaneExtensions({
            tenant: {Name: '/folder/db', ControlPlane: {id: 'id'}},
            database: 'id',
            clusterName: 'cluster',
            clusterDataLoaded: false,
            backupsRenderer: true,
            monitoringRenderer: true,
        }).hasBackups,
    ).toBe(false);
});

const folderCases = [
    {label: 'absent', folder: undefined, pathAvailable: true, idAvailable: false},
    {label: 'null', folder: null, pathAvailable: true, idAvailable: false},
    {label: 'empty', folder: '', pathAvailable: false, idAvailable: false},
    {label: 'whitespace', folder: '   ', pathAvailable: false, idAvailable: false},
    {label: 'nonempty', folder: 'folder', pathAvailable: true, idAvailable: true},
];
for (const database of ['/folder/db', 'cp-id']) {
    test.each(folderCases)(
        'Backups nullish folder contract: $label on ' + database,
        ({folder, pathAvailable, idAvailable}) => {
            const tenant = JSON.parse(
                JSON.stringify({
                    Name: '/folder/db',
                    ControlPlane: {id: 'cp-id', folder_id: folder},
                }),
            );
            const result = getControlPlaneExtensions({
                tenant,
                database,
                clusterName: 'cluster',
                clusterDataLoaded: false,
                backupsRenderer: true,
                monitoringRenderer: true,
            });
            expect(result.hasBackups).toBe(database === '/folder/db' ? pathAvailable : idAvailable);
        },
    );
}
