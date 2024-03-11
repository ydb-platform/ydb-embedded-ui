import {useCallback} from 'react';

import {
    useAutofetcher,
    useSearchQuery,
    useTypedDispatch,
    useTypedSelector,
} from '../../../../../utils/hooks';
import {
    getTopNodesByLoad,
    selectTopNodesByLoad,
    setDataWasNotLoaded,
} from '../../../../../store/reducers/tenantOverview/topNodesByLoad/topNodesByLoad';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {getTopNodesByLoadColumns} from '../../../../Nodes/getNodesColumns';

import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';

import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';

interface TopNodesByLoadProps {
    path: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TopNodesByLoad({path, additionalNodesProps}: TopNodesByLoadProps) {
    const dispatch = useTypedDispatch();

    const query = useSearchQuery();

    const {wasLoaded, loading, error} = useTypedSelector((state) => state.topNodesByLoad);
    const {autorefresh} = useTypedSelector((state) => state.schema);
    const topNodes = useTypedSelector(selectTopNodesByLoad);
    const columns = getTopNodesByLoadColumns(additionalNodesProps?.getNodeRef);

    const fetchNodes = useCallback(
        (isBackground) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }

            dispatch(getTopNodesByLoad({tenant: path}));
        },
        [dispatch, path],
    );

    useAutofetcher(fetchNodes, [fetchNodes], autorefresh);

    const title = getSectionTitle({
        entity: i18n('nodes'),
        postfix: i18n('by-load'),
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
