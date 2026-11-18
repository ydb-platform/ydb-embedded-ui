import {prepareControlPlaneInfo} from './utils';

test('control plane info keeps the canonical path and a configured zero', () => {
    const data = prepareControlPlaneInfo({
        Name: '/canonical',
        ControlPlane: {
            name: 'Display',
            scale_policy: {fixed_scale: {size: 0}},
            storage_config: {storage_size_limit: 0},
        },
    });
    expect(data).toMatchObject({name: 'Display', path: '/canonical', size: 0, storageLimit: 0});
});

test('missing, empty and null control plane fields are omitted', () => {
    const tenant = JSON.parse('{"ControlPlane":{"endpoint":null,"folder_id":""}}');
    expect(prepareControlPlaneInfo(tenant)).toMatchObject({
        path: undefined,
        endpoint: undefined,
        folder: undefined,
    });
});
