import {useLocation} from 'react-router';

import {parseQuery} from '../../../../../routes';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import {
    sendTenantOverviewTopShardsQuery,
    setDataWasNotLoaded,
} from '../../../../../store/reducers/tenantOverview/topShards/tenantOverviewTopShards';
import {useAutofetcher, useTypedDispatch, useTypedSelector} from '../../../../../utils/hooks';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {getTopShardsColumns} from '../../TopShards/getTopShardsColumns';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';

interface TopShardsProps {
    path: string;
}

export const TopShards = ({path}: TopShardsProps) => {
    const dispatch = useTypedDispatch();
    const location = useLocation();

    const query = parseQuery(location);

    const {autorefresh, currentSchemaPath} = useTypedSelector((state) => state.schema);

    const {
        loading,
        data: {result: data = undefined} = {},
        error,
        wasLoaded,
    } = useTypedSelector((state) => state.tenantOverviewTopShards);

    useAutofetcher(
        (isBackground) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }
            dispatch(sendTenantOverviewTopShardsQuery(path, currentSchemaPath));
        },
        [dispatch, path, currentSchemaPath],
        autorefresh,
    );

    const columns = getTopShardsColumns(path, location);

    const title = getSectionTitle({
        entity: i18n('shards'),
        postfix: i18n('by-cpu-usage'),
        link: getTenantPath({
            ...query,
            [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.topShards,
        }),
    });

    return (
        <TenantOverviewTableLayout
            data={data || []}
            columns={columns}
            title={title}
            loading={loading}
            wasLoaded={wasLoaded}
            error={error}
            tableClassNameModifiers={{'top-queries': true}}
        />
    );
};
