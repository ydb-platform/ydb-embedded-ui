import cn from 'bem-cn-lite';
import {useDispatch} from 'react-redux';
import {useCallback} from 'react';

import DataTable from '@gravity-ui/react-data-table';

import {
    TENANT_OVERVIEW_TABLES_LIMIT,
    TENANT_OVERVIEW_TABLES_SETTINGS,
} from '../../../../../utils/constants';
import {useAutofetcher, useTypedSelector} from '../../../../../utils/hooks';
import {
    getTopComputeNodesByLoad,
    getTopNodesByLoad,
    selectTopNodesByLoad,
    setDataWasNotLoaded,
} from '../../../../../store/reducers/tenantOverview/topNodesByLoad/topNodesByLoad';
import type {EPathType} from '../../../../../types/api/schema';
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {TableSkeleton} from '../../../../../components/TableSkeleton/TableSkeleton';
import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {getTopNodesColumns} from '../../../../Nodes/getNodesColumns';
import {isDatabaseEntityType} from '../../../utils/schema';

import i18n from '../i18n';
import './TenantCpu.scss';

const b = cn('tenant-overview-cpu');

interface TopNodesByLoadProps {
    path?: string;
    type?: EPathType;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TopNodesByLoad({path, type, additionalNodesProps}: TopNodesByLoadProps) {
    const dispatch = useDispatch();

    const {wasLoaded, loading, error} = useTypedSelector((state) => state.topNodesByLoad);
    const {autorefresh} = useTypedSelector((state) => state.schema);
    const topNodes = useTypedSelector(selectTopNodesByLoad);
    const columns = getTopNodesColumns(additionalNodesProps?.getNodeRef);

    const fetchNodes = useCallback(
        (isBackground) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }

            // For not DB entities we always use /compute endpoint instead of /nodes
            // since /nodes can return data only for tenants
            if (path && !isDatabaseEntityType(type)) {
                dispatch(getTopComputeNodesByLoad({path}));
            } else {
                dispatch(getTopNodesByLoad({tenant: path}));
            }
        },
        [dispatch, path, type],
    );

    useAutofetcher(fetchNodes, [fetchNodes], autorefresh);

    const renderContent = () => {
        if (error) {
            return <ResponseError error={error} />;
        }

        if (loading && !wasLoaded) {
            return <TableSkeleton rows={TENANT_OVERVIEW_TABLES_LIMIT} />;
        }

        return (
            <DataTable
                theme="yandex-cloud"
                data={topNodes || []}
                columns={columns}
                settings={TENANT_OVERVIEW_TABLES_SETTINGS}
                emptyDataMessage={i18n('top-nodes.empty-data')}
            />
        );
    };

    return (
        <>
            <div className={b('title')}>Top nodes by load</div>
            <div className={b('table')}>{renderContent()}</div>
        </>
    );
}
