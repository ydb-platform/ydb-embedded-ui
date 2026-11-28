import {cloudOptions, databaseCloudId} from '../clouds';

test('uses the CP cloud and falls back to the viewer attribute when CP omits it', () => {
    const attributes = {cloud_id: 'viewer'};
    expect(databaseCloudId({ControlPlane: {cloud_id: 'cp'}, UserAttributes: attributes})).toBe(
        'cp',
    );
    expect(databaseCloudId({UserAttributes: attributes})).toBe('viewer');
    expect(databaseCloudId({})).toBeUndefined();
});

test('shows names, disambiguates duplicates and keeps unresolved and saved IDs selectable', () => {
    const options = cloudOptions(
        ['1', '2', '3', '4'],
        [
            {id: '1', name: 'prod'},
            {id: '2', name: 'prod'},
            {id: '3', name: 'analytics'},
        ],
        ['obsolete', '2', 'removed'],
    );
    expect(options).toEqual([
        {value: '4', content: '4'},
        {value: '3', content: 'analytics'},
        {value: 'obsolete', content: 'obsolete'},
        {value: '1', content: 'prod (1)'},
        {value: '2', content: 'prod (2)'},
        {value: 'removed', content: 'removed'},
    ]);
});
