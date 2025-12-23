import {ResponseError} from '../../../../components/Errors/ResponseError';
import {JsonViewer} from '../../../../components/JsonViewer/JsonViewer';
import {Loader} from '../../../../components/Loader';
import {useClusterWithProxy} from '../../../../store/reducers/cluster/cluster';
import {overviewApi} from '../../../../store/reducers/overview/overview';
import {cn} from '../../../../utils/cn';
import {useAutoRefreshInterval} from '../../../../utils/hooks';

import './Describe.scss';

const b = cn('ydb-describe');

interface IDescribeProps {
    path: string;
    database: string;
    databaseFullPath: string;
    scrollContainerRef: React.RefObject<HTMLElement>;
}

const Describe = ({path, database, databaseFullPath, scrollContainerRef}: IDescribeProps) => {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const useMetaProxy = useClusterWithProxy();

    const {currentData, isFetching, error} = overviewApi.useGetOverviewQuery(
        {path, database, databaseFullPath, useMetaProxy},
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;

    if (loading) {
        return <Loader size="m" />;
    }

    if (!currentData && !error) {
        return <div className={b('message-container')}>Empty</div>;
    }

    return (
        <div className={b()}>
            {error ? <ResponseError error={error} /> : null}
            {currentData ? (
                <div className={b('result')}>
                    <JsonViewer
                        value={currentData}
                        withClipboardButton={{
                            withLabel: false,
                            copyText: JSON.stringify(currentData),
                        }}
                        search
                        collapsedInitially
                        scrollContainerRef={scrollContainerRef}
                    />
                </div>
            ) : null}
        </div>
    );
};

export default Describe;
