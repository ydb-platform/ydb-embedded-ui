import {useDispatch} from 'react-redux';
import {useCallback} from 'react';

import {useAutofetcher, useTypedSelector} from '../../../../../utils/hooks';
import {
    getTopNodesByMemory,
    selectTopNodesByMemory,
    setDataWasNotLoaded,
} from '../../../../../store/reducers/tenantOverview/topNodesByMemory/topNodesByMemory';
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {getTopNodesByMemoryColumns} from '../../../../Nodes/getNodesColumns';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';

import i18n from '../i18n';

interface TopNodesByMemoryProps {
    path: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TopNodesByMemory({path, additionalNodesProps}: TopNodesByMemoryProps) {
    const dispatch = useDispatch();

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

    return (
        <TenantOverviewTableLayout
            data={topNodes || []}
            columns={columns}
            title="Top nodes by memory"
            loading={loading}
            wasLoaded={wasLoaded}
            error={error}
            emptyDataMessage={i18n('top-nodes.empty-data')}
        />
    );
}
