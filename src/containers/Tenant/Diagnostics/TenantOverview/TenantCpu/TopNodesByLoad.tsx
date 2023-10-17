import {useDispatch} from 'react-redux';
import {useCallback} from 'react';

import {useAutofetcher, useTypedSelector} from '../../../../../utils/hooks';
import {
    getTopNodesByLoad,
    selectTopNodesByLoad,
    setDataWasNotLoaded,
} from '../../../../../store/reducers/tenantOverview/topNodesByLoad/topNodesByLoad';
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {getTopNodesByLoadColumns} from '../../../../Nodes/getNodesColumns';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';

import i18n from '../i18n';

interface TopNodesByLoadProps {
    path: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TopNodesByLoad({path, additionalNodesProps}: TopNodesByLoadProps) {
    const dispatch = useDispatch();

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

    return (
        <TenantOverviewTableLayout
            data={topNodes || []}
            columns={columns}
            title="Top nodes by load"
            loading={loading}
            wasLoaded={wasLoaded}
            error={error}
            emptyDataMessage={i18n('top-nodes.empty-data')}
        />
    );
}
