import {useDispatch} from 'react-redux';

import {getSchema, setCurrentSchemaPath} from '../../../../../store/reducers/schema/schema';
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

    const onSchemaClick = (schemaPath: string) => {
        return () => {
            dispatch(setCurrentSchemaPath(schemaPath));
            dispatch(getSchema({path: schemaPath}));
            history.go(0);
        };
    };

    const columns = getTopShardsColumns(onSchemaClick, path);

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
