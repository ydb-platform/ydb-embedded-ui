import type {PreparedTenant} from '../../../../../store/reducers/tenants/types';
import {uiFactory} from '../../../../../uiFactory/uiFactory';

export function prepareAdditionalDatabaseInfoItems(databaseData?: PreparedTenant) {
    if (!databaseData) {
        return undefined;
    }

    return uiFactory.getAdditionalDatabaseInfoItems?.({databaseData});
}
