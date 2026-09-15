import qs from 'qs';

import {getTenantPath} from '../../../../routes';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../store/reducers/tenant/constants';
import {TenantTabsGroups} from '../../TenantPages';

export function getConsumerPath(name: string) {
    const queryParams = qs.parse(location.search, {ignoreQueryPrefix: true});
    return getTenantPath({
        ...queryParams,
        [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.partitions,
        selectedConsumer: name,
    });
}
