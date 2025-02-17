import {ClipboardButton} from '@gravity-ui/uikit';
import {shallowEqual} from 'react-redux';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {JsonViewer} from '../../../../components/JsonViewer/JsonViewer';
import {useUnipikaConvert} from '../../../../components/JsonViewer/unipika/unipika';
import {Loader} from '../../../../components/Loader';
import {
    selectSchemaMergedChildrenPaths,
    useGetMultiOverviewQuery,
} from '../../../../store/reducers/overview/overview';
import type {EPathType} from '../../../../types/api/schema';
import {cn} from '../../../../utils/cn';
import {useAutoRefreshInterval, useTypedSelector} from '../../../../utils/hooks';
import {isEntityWithMergedImplementation} from '../../utils/schema';

import './Describe.scss';

const b = cn('ydb-describe');

interface IDescribeProps {
    path: string;
    database: string;
    type?: EPathType;
}

const Describe = ({path, database, type}: IDescribeProps) => {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const isEntityWithMergedImpl = isEntityWithMergedImplementation(type);

    const mergedChildrenPaths = useTypedSelector(
        (state) => selectSchemaMergedChildrenPaths(state, path, type, database),
        shallowEqual,
    );

    let paths: string[] = [];
    if (!isEntityWithMergedImpl) {
        paths = [path];
    } else if (mergedChildrenPaths) {
        paths = [path, ...mergedChildrenPaths];
    }

    const {mergedDescribe, loading, error} = useGetMultiOverviewQuery({
        paths,
        autoRefreshInterval,
        database,
    });

    let preparedDescribeData: Object | undefined;
    if (mergedDescribe) {
        const paths = Object.keys(mergedDescribe);
        if (paths.length === 1) {
            preparedDescribeData = mergedDescribe[paths[0]];
        } else {
            preparedDescribeData = mergedDescribe;
        }
    }

    const convertedValue = useUnipikaConvert(preparedDescribeData);

    if (loading || (isEntityWithMergedImpl && !mergedChildrenPaths)) {
        return <Loader size="m" />;
    }

    if (!preparedDescribeData && !error) {
        return <div className={b('message-container')}>Empty</div>;
    }

    return (
        <div className={b()}>
            {error ? <ResponseError error={error} /> : null}
            {preparedDescribeData ? (
                <div className={b('result')}>
                    <JsonViewer
                        value={convertedValue}
                        extraTools={
                            <ClipboardButton
                                view="flat-secondary"
                                text={JSON.stringify(preparedDescribeData)}
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
