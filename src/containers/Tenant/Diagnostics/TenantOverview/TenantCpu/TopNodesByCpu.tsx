import {useDispatch} from 'react-redux';
import {useCallback} from 'react';

import {useAutofetcher, useTypedSelector} from '../../../../../utils/hooks';
import {
    getTopNodesByCpu,
    selectTopNodesByCpu,
    setDataWasNotLoaded,
} from '../../../../../store/reducers/tenantOverview/topNodesByCpu/topNodesByCpu';
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {getTopNodesByCpuColumns} from '../../../../Nodes/getNodesColumns';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';

import i18n from '../i18n';

interface TopNodesByCpuProps {
    path: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TopNodesByCpu({path, additionalNodesProps}: TopNodesByCpuProps) {
    const dispatch = useDispatch();

    const {wasLoaded, loading, error} = useTypedSelector((state) => state.topNodesByCpu);
    const {autorefresh} = useTypedSelector((state) => state.schema);
    const topNodes = useTypedSelector(selectTopNodesByCpu);
    const columns = getTopNodesByCpuColumns(additionalNodesProps?.getNodeRef);

    const fetchNodes = useCallback(
        (isBackground) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }

            dispatch(getTopNodesByCpu({tenant: path}));
        },
        [dispatch, path],
    );

    useAutofetcher(fetchNodes, [fetchNodes], autorefresh);

    return (
        <TenantOverviewTableLayout
            data={topNodes || []}
            columns={columns}
            title="Top nodes by pools usage"
            loading={loading}
            wasLoaded={wasLoaded}
            error={error}
            emptyDataMessage={i18n('top-nodes.empty-data')}
        />
    );
}
