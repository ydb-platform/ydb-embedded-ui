import {useDispatch} from 'react-redux';
import {useLocation} from 'react-router';

import {useAutofetcher, useTypedSelector} from '../../../../../utils/hooks';
import {
    sendTenantOverviewTopShardsQuery,
    setDataWasNotLoaded,
} from '../../../../../store/reducers/tenantOverview/topShards/tenantOverviewTopShards';
import {getTopShardsColumns} from '../../TopShards/getTopShardsColumns';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';

interface TopShardsProps {
    path: string;
}

export const TopShards = ({path}: TopShardsProps) => {
    const dispatch = useDispatch();
    const location = useLocation();

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

    return (
        <TenantOverviewTableLayout
            data={data || []}
            columns={columns}
            title="Top shards by cpu usage"
            loading={loading}
            wasLoaded={wasLoaded}
            error={error}
            tableClassNameModifiers={{'top-queries': true}}
        />
    );
};
