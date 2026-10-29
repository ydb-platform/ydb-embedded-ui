import type {MetaBaseClusterInfo, MetaClusterSettings} from '../types/api/meta';

export function shouldUseDatabaseId(
    {
        control_plane: controlPlane,
        settings,
    }: Pick<MetaBaseClusterInfo, 'control_plane'> & {
        settings?: MetaClusterSettings;
    },
    globalUseDatabaseId?: boolean,
) {
    return (
        Boolean(globalUseDatabaseId || controlPlane) &&
        settings?.use_database_id !== false &&
        settings?.use_meta_proxy !== false
    );
}
