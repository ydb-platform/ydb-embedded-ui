import {useDispatch} from 'react-redux';
import {useCallback} from 'react';

import {useAutofetcher, useTypedSelector, useSearchQuery} from '../../../../../utils/hooks';
import {
    getTopNodesByMemory,
    selectTopNodesByMemory,
    setDataWasNotLoaded,
} from '../../../../../store/reducers/tenantOverview/topNodesByMemory/topNodesByMemory';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {getTopNodesByMemoryColumns} from '../../../../Nodes/getNodesColumns';

import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';

import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';

interface TopNodesByMemoryProps {
    path: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TopNodesByMemory({path, additionalNodesProps}: TopNodesByMemoryProps) {
    const dispatch = useDispatch();

    const query = useSearchQuery();

    const {wasLoaded, loading, error} = useTypedSelector((state) => state.topNodesByMemory);
    const {autorefresh} = useTypedSelector((state) => state.schema);
    const topNodes = useTypedSelector(selectTopNodesByMemory);
    const columns = getTopNodesByMemoryColumns({
        getNodeRef: additionalNodesProps?.getNodeRef,
    });

    const fetchNodes = useCallback(
        (isBackground) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }

            dispatch(getTopNodesByMemory({tenant: path}));
        },
        [dispatch, path],
    );

    useAutofetcher(fetchNodes, [fetchNodes], autorefresh);

    const title = getSectionTitle({
        entity: i18n('nodes'),
        postfix: i18n('by-memory'),
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
