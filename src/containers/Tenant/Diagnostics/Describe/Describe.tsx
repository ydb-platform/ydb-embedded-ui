import {ClipboardButton} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import JSONTree from 'react-json-inspector';
import {shallowEqual} from 'react-redux';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {Loader} from '../../../../components/Loader';
import {
    overviewApi,
    selectPreparedPathOverview,
} from '../../../../store/reducers/overview/overview';
import {selectSchemaMergedChildrenPaths} from '../../../../store/reducers/schema/schema';
import type {EPathType} from '../../../../types/api/schema';
import {cn} from '../../../../utils/cn';
import {useAutoRefreshInterval, useTypedSelector} from '../../../../utils/hooks';
import {isEntityWithMergedImplementation} from '../../utils/schema';

import './Describe.scss';
import 'react-json-inspector/json-inspector.css';

const b = cn('ydb-describe');

const expandMap = new Map();

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
    const {currentData, isFetching, error} = overviewApi.useGetOverviewQuery(
        paths.length ? {paths, database} : skipToken,
        {
            pollingInterval: autoRefreshInterval,
        },
    );
    const loading = isFetching && currentData === undefined;

    const data = useTypedSelector((state) => selectPreparedPathOverview(state, paths, database));

    const currentDescribe = data;

    let preparedDescribeData: Object | undefined;
    if (currentDescribe) {
        const paths = Object.keys(currentDescribe);
        if (paths.length === 1) {
            preparedDescribeData = currentDescribe[paths[0]];
        } else {
            preparedDescribeData = currentDescribe;
        }
    }

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
                    <JSONTree
                        data={preparedDescribeData}
                        className={b('tree')}
                        onClick={({path}) => {
                            const newValue = !(expandMap.get(path) || false);
                            expandMap.set(path, newValue);
                        }}
                        searchOptions={{
                            debounceTime: 300,
                        }}
                        isExpanded={(keypath) => {
                            return expandMap.get(keypath) || false;
                        }}
                    />
                    <ClipboardButton
                        view="flat-secondary"
                        text={JSON.stringify(preparedDescribeData)}
                        className={b('copy')}
                    />
                </div>
            ) : null}
        </div>
    );
};

export default Describe;
