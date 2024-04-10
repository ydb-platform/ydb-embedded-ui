import React from 'react';

import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import {
    getTopNodesByCpu,
    selectTopNodesByCpu,
    setDataWasNotLoaded,
} from '../../../../../store/reducers/tenantOverview/topNodesByCpu/topNodesByCpu';
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {
    useAutofetcher,
    useSearchQuery,
    useTypedDispatch,
    useTypedSelector,
} from '../../../../../utils/hooks';
import {getTopNodesByCpuColumns} from '../../../../Nodes/getNodesColumns';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';

interface TopNodesByCpuProps {
    path: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TopNodesByCpu({path, additionalNodesProps}: TopNodesByCpuProps) {
    const dispatch = useTypedDispatch();

    const query = useSearchQuery();

    const {wasLoaded, loading, error} = useTypedSelector((state) => state.topNodesByCpu);
    const {autorefresh} = useTypedSelector((state) => state.schema);
    const topNodes = useTypedSelector(selectTopNodesByCpu);
    const columns = getTopNodesByCpuColumns(additionalNodesProps?.getNodeRef);

    const fetchNodes = React.useCallback(
        (isBackground: boolean) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }

            dispatch(getTopNodesByCpu({tenant: path}));
        },
        [dispatch, path],
    );

    useAutofetcher(fetchNodes, [fetchNodes], autorefresh);

    const title = getSectionTitle({
        entity: i18n('nodes'),
        postfix: i18n('by-pools-usage'),
        link: getTenantPath({
            ...query,
            [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.nodes,
        }),
    });

    return (
        <TenantOverviewTableLayout
            data={topNodes || []}
            columns={columns}
            title={title}
            loading={loading}
            wasLoaded={wasLoaded}
            error={error}
            emptyDataMessage={i18n('top-nodes.empty-data')}
        />
    );
}
