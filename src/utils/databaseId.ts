import type {MetaClusterSettings} from '../types/api/meta';
import type {TTenant} from '../types/api/tenant';

export function getDatabaseNavigationId(
    database: Pick<TTenant, 'Name' | 'Id' | 'ControlPlane'>,
    {
        settings,
        useDatabaseId,
        backend,
    }: {
        settings?: MetaClusterSettings;
        useDatabaseId?: boolean;
        backend?: string;
    } = {},
) {
    if (backend || settings?.use_database_id === false || settings?.use_meta_proxy === false) {
        return database.Name;
    }

    return database.ControlPlane?.id || (useDatabaseId && database.Id) || database.Name;
}
