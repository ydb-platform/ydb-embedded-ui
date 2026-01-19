import {QueryResultTable} from '../../../../../components/QueryResultTable';
import {previewApi} from '../../../../../store/reducers/preview';
import {prepareQueryWithPragmas} from '../../../../../store/reducers/query/utils';
import {SETTING_KEYS} from '../../../../../store/reducers/settings/constants';
import {useQueryExecutionSettings} from '../../../../../utils/hooks/useQueryExecutionSettings';
import {useSetting} from '../../../../../utils/hooks/useSetting';
import {transformPath} from '../../../ObjectSummary/transformPath';
import {isExternalTableType} from '../../../utils/schema';
import type {PreviewContainerProps} from '../types';

import {Preview} from './PreviewView';

const TABLE_PREVIEW_LIMIT = 100;

export function TablePreview({database, path, type, databaseFullPath}: PreviewContainerProps) {
    const [querySettings] = useQueryExecutionSettings();
    const [binaryDataInPlainTextDisplay] = useSetting<boolean>(
        SETTING_KEYS.BINARY_DATA_IN_PLAIN_TEXT_DISPLAY,
    );

    const relativePath = transformPath(path, databaseFullPath);

    const baseQuery = `select * from \`${relativePath}\` limit 101`;
    const query = prepareQueryWithPragmas(baseQuery, querySettings.pragmas);

    const encodeTextWithBase64 = !binaryDataInPlainTextDisplay;

    const {currentData, isFetching, error} = previewApi.useSendQueryQuery(
        {
            database,
            query,
            action: isExternalTableType(type) ? 'execute-query' : 'execute-scan',
            limitRows: TABLE_PREVIEW_LIMIT,
            base64: encodeTextWithBase64,
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
