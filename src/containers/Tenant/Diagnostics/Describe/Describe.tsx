import React from 'react';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {JsonViewer} from '../../../../components/JsonViewer/JsonViewer';
import {Loader} from '../../../../components/Loader';
import {useClusterWithProxy} from '../../../../store/reducers/cluster/cluster';
import {overviewApi} from '../../../../store/reducers/overview/overview';
import {cn} from '../../../../utils/cn';
import {useAutoRefreshInterval} from '../../../../utils/hooks';

import './Describe.scss';

const b = cn('ydb-describe');

// react-unipika keeps the Full value dialog in its internal state when the viewer value changes
// and has no API to close it, so close it the same way a user would.
function closeFullValueDialog() {
    const dialog = document
        .querySelector('.g-ru-full-value-dialog__full-value')
        ?.closest('[role="dialog"]');
    dialog?.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
}

interface IDescribeProps {
    path: string;
    database: string;
    databaseFullPath: string;
    scrollContainerRef: React.RefObject<HTMLElement>;
}

const Describe = ({path, database, databaseFullPath, scrollContainerRef}: IDescribeProps) => {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const useMetaProxy = useClusterWithProxy();

    const {data, currentData, isFetching, error} = overviewApi.useGetOverviewQuery(
        {path, database, databaseFullPath, useMetaProxy},
        {pollingInterval: autoRefreshInterval},
    );

    // The viewer stays mounted between objects, so its Full value dialog must not outlive the object.
    React.useEffect(() => {
        closeFullValueDialog();
    }, [path, database]);

    const loading = isFetching && currentData === undefined;

    return (
        <div className={b()} data-qa="describe">
            {loading ? <Loader size="m" /> : null}
            {!loading && !currentData && !error ? (
                <div className={b('message-container')}>Empty</div>
            ) : null}
            {error ? <ResponseError error={error} /> : null}
            {/* Keep the viewer mounted while the next object loads to preserve expanded paths. */}
            <div hidden={!currentData}>
                {data ? (
                    <div className={b('result')}>
                        <JsonViewer
                            value={data}
                            withClipboardButton={{
                                withLabel: false,
                                copyText: JSON.stringify(data),
                            }}
                            search
                            collapsedInitially
                            scrollContainerRef={scrollContainerRef}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default Describe;
