import {useDispatch} from 'react-redux';
import {useLocation} from 'react-router';

import {useAutofetcher, useTypedSelector} from '../../../../../utils/hooks';
import {parseQuery} from '../../../../../routes';

import {
    sendTenantOverviewTopShardsQuery,
    setDataWasNotLoaded,
} from '../../../../../store/reducers/tenantOverview/topShards/tenantOverviewTopShards';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import {getTopShardsColumns} from '../../TopShards/getTopShardsColumns';

import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';

import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';

interface TopShardsProps {
    path: string;
}

export const TopShards = ({path}: TopShardsProps) => {
    const dispatch = useDispatch();
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
