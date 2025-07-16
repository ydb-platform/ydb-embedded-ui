import {QueryResultTable} from '../../../../../components/QueryResultTable';
import {previewApi} from '../../../../../store/reducers/preview';
import {useQueryExecutionSettings} from '../../../../../utils/hooks';
import {isExternalTableType} from '../../../utils/schema';
import type {PreviewContainerProps} from '../types';

import {Preview} from './PreviewView';

const TABLE_PREVIEW_LIMIT = 100;

export function TablePreview({database, path, type}: PreviewContainerProps) {
    const query = `select * from \`${path}\` limit 101`;
    const [querySettings] = useQueryExecutionSettings();
    const {currentData, isFetching, error} = previewApi.useSendQueryQuery(
        {
            database,
            query,
            action: isExternalTableType(type) ? 'execute-query' : 'execute-scan',
            limitRows: TABLE_PREVIEW_LIMIT,
            pragmas: querySettings.pragmas,
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
            path={path}
            renderResult={renderResult}
            loading={loading}
            error={error}
            truncated={data.truncated}
            quantity={data.result?.length}
        />
    );
}
