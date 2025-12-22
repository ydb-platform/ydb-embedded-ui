import React from 'react';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {JsonViewer} from '../../../../components/JsonViewer/JsonViewer';
import {LoaderWrapper} from '../../../../components/LoaderWrapper/LoaderWrapper';
import {configsApi} from '../../../../store/reducers/configs';
import {cn} from '../../../../utils/cn';
import {useAutoRefreshInterval} from '../../../../utils/hooks/useAutoRefreshInterval';
import i18n from '../../i18n';

import './Config.scss';

const b = cn('ydb-config');

interface ConfigProps {
    database?: string;
}
export function Config({database}: ConfigProps) {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {currentData, isLoading, error} = configsApi.useGetConfigQuery(
        {database},
        {pollingInterval: autoRefreshInterval},
    );

    const {current} = currentData || {};

    const copyText = React.useMemo(() => JSON.stringify(current, null, 4), [current]);

    return (
        <LoaderWrapper loading={isLoading}>
            {current ? (
                <div className={b()}>
                    <div className={b('scroll-container')} ref={scrollContainerRef}>
                        <JsonViewer
                            value={current}
                            collapsedInitially
                            withClipboardButton={{copyText, withLabel: i18n('action_copy-config')}}
                            scrollContainerRef={scrollContainerRef}
                            toolbarClassName={b('json-viewer-toolbar')}
                        />
                    </div>
                </div>
            ) : null}
            {error ? <ResponseError error={error} /> : null}
        </LoaderWrapper>
    );
}
