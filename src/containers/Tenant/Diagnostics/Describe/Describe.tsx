import {ClipboardButton} from '@gravity-ui/uikit';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {JsonViewer} from '../../../../components/JsonViewer/JsonViewer';
import {useUnipikaConvert} from '../../../../components/JsonViewer/unipika/unipika';
import {Loader} from '../../../../components/Loader';
import {overviewApi} from '../../../../store/reducers/overview/overview';
import {cn} from '../../../../utils/cn';
import {useAutoRefreshInterval} from '../../../../utils/hooks';

import './Describe.scss';

const b = cn('ydb-describe');

interface IDescribeProps {
    path: string;
    database: string;
    databaseFullPath: string;
}

const Describe = ({path, database, databaseFullPath}: IDescribeProps) => {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {currentData, isFetching, error} = overviewApi.useGetOverviewQuery(
        {path, database, databaseFullPath},
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;

    const convertedValue = useUnipikaConvert(currentData);

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
                        value={convertedValue}
                        extraTools={
                            <ClipboardButton
                                view="flat-secondary"
                                text={JSON.stringify(currentData)}
                            />
                        }
                        search
                        collapsedInitially
                    />
                </div>
            ) : null}
        </div>
    );
};

export default Describe;
