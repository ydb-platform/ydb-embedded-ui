import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';

import {getControlPlaneTab, prepareControlPlaneInfo} from './utils';

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
