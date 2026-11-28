import type {PreparedTenant} from '../../store/reducers/tenants/types';

export function databaseCloudId(row: Pick<PreparedTenant, 'ControlPlane' | 'UserAttributes'>) {
    return row.ControlPlane?.cloud_id || row.UserAttributes?.cloud_id;
}

export function cloudOptions(
    ids: string[],
    clouds: {id: string; name: string}[],
    selected: string[],
) {
    const names = new Map(clouds.map(({id, name}) => [id, name]));
    const counts = new Map<string, number>();
    for (const name of names.values()) {
        counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    // Keep a saved selection visible and clearable if the cloud is no longer in the list.
    const values = Array.from(new Set([...ids, ...selected]));
    return values
        .map((value) => {
            const name = names.get(value);
            const content =
                name && (counts.get(name) ?? 0) > 1 ? `${name} (${value})` : name || value;
            return {value, content};
        })
        .sort((a, b) => a.content.localeCompare(b.content));
}
