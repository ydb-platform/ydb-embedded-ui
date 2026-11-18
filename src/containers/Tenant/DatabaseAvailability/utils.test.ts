import {prepareControlPlaneInfo} from './utils';

test('control plane info keeps the canonical path next to the display name', () => {
    const data = prepareControlPlaneInfo({
        Name: '/canonical',
        Type: 'Dedicated',
        ControlPlane: {name: 'Display', status: 'RUNNING'},
    });
    expect(data).toEqual({
        name: 'Display',
        path: '/canonical',
        type: 'Dedicated',
        status: 'RUNNING',
    });
});

test('missing, empty and null control plane fields are omitted', () => {
    const tenant = JSON.parse('{"Name":"","ControlPlane":{"name":null,"status":""}}');
    expect(prepareControlPlaneInfo(tenant)).toEqual({
        name: undefined,
        path: undefined,
        type: undefined,
        status: undefined,
    });
});
