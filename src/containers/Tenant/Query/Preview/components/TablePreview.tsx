import {QueryResultTable} from '../../../../../components/QueryResultTable';
import {previewApi} from '../../../../../store/reducers/preview';
import {prepareQueryWithPragmas} from '../../../../../store/reducers/query/utils';
import {useTenantBaseInfo} from '../../../../../store/reducers/tenant/tenant';
import {useQueryExecutionSettings} from '../../../../../utils/hooks/useQueryExecutionSettings';
import {transformPath} from '../../../ObjectSummary/transformPath';
import {isExternalTableType} from '../../../utils/schema';
import type {PreviewContainerProps} from '../types';

import {Preview} from './PreviewView';

const TABLE_PREVIEW_LIMIT = 100;

export function TablePreview({database, path, type}: PreviewContainerProps) {
    const [querySettings] = useQueryExecutionSettings();
    const {name} = useTenantBaseInfo(database);

    const relativePath = transformPath(path, database, name);

    const baseQuery = `select * from \`${relativePath}\` limit 101`;
    const query = prepareQueryWithPragmas(baseQuery, querySettings.pragmas);

    const {currentData, isFetching, error} = previewApi.useSendQueryQuery(
        {
            database,
            query,
            action: isExternalTableType(type) ? 'execute-query' : 'execute-scan',
            limitRows: TABLE_PREVIEW_LIMIT,
        },
        {
            refetchOnMountOrArgChange: true,
        },
    );
    const loading = isFetching && currentData === undefined;
    const data = currentData?.resultSets?.[0] ?? {};

    const renderResult = () => {
        return <QueryResultTable data={data.result} columns={data.columns} />;
    };

    return (
        <Preview
            path={relativePath}
            renderResult={renderResult}
            loading={loading}
            error={error}
            truncated={data.truncated}
            quantity={data.result?.length}
        />
    );
}
