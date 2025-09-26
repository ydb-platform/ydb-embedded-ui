import React from 'react';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {JsonViewer} from '../../../../components/JsonViewer/JsonViewer';
import {useUnipikaConvert} from '../../../../components/JsonViewer/unipika/unipika';
import {LoaderWrapper} from '../../../../components/LoaderWrapper/LoaderWrapper';
import {configsApi} from '../../../../store/reducers/configs';
import {useAutoRefreshInterval} from '../../../../utils/hooks/useAutoRefreshInterval';
import i18n from '../../i18n';

interface ConfigProps {
    database?: string;
}
export function Config({database}: ConfigProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {currentData, isLoading, error} = configsApi.useGetConfigQuery(
        {database},
        {pollingInterval: autoRefreshInterval},
    );

    const {current} = currentData || {};

    const convertedValue = useUnipikaConvert(current);

    const copyText = React.useMemo(() => JSON.stringify(current, null, 4), [current]);

    return (
        <LoaderWrapper loading={isLoading}>
            {current ? (
                <JsonViewer
                    value={convertedValue}
                    collapsedInitially
                    withClipboardButton={{copyText, withLabel: i18n('action_copy-config')}}
                />
            ) : null}
            {error ? <ResponseError error={error} /> : null}
        </LoaderWrapper>
    );
}
