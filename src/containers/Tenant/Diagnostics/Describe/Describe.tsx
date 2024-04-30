import {skipToken} from '@reduxjs/toolkit/query';
import JSONTree from 'react-json-inspector';
import {shallowEqual} from 'react-redux';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {Loader} from '../../../../components/Loader';
import {describeApi} from '../../../../store/reducers/describe';
import {selectSchemaMergedChildrenPaths} from '../../../../store/reducers/schema/schema';
import type {EPathType} from '../../../../types/api/schema';
import {cn} from '../../../../utils/cn';
import {useTypedSelector} from '../../../../utils/hooks';
import {isEntityWithMergedImplementation} from '../../utils/schema';

import './Describe.scss';
import 'react-json-inspector/json-inspector.css';

const b = cn('kv-describe');

const expandMap = new Map();

interface IDescribeProps {
    tenant: string;
    type?: EPathType;
}

const Describe = ({tenant, type}: IDescribeProps) => {
    const {autorefresh, currentSchemaPath} = useTypedSelector((state) => state.schema);

    const isEntityWithMergedImpl = isEntityWithMergedImplementation(type);

    const mergedChildrenPaths = useTypedSelector(
        (state) => selectSchemaMergedChildrenPaths(state, currentSchemaPath, type),
        shallowEqual,
    );

    const path = currentSchemaPath || tenant;
    let paths: string[] | typeof skipToken = skipToken;
    if (!isEntityWithMergedImpl) {
        paths = [path];
    } else if (mergedChildrenPaths) {
        paths = [path, ...mergedChildrenPaths];
    }
    const {currentData, isFetching, error} = describeApi.useGetDescribeQuery(paths, {
        pollingInterval: autorefresh,
    });
    const loading = isFetching && currentData === undefined;
    const currentDescribe = currentData;

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

    if (error) {
        return <ResponseError error={error} className={b('message-container')} />;
    }

    if (!loading && !preparedDescribeData) {
        return <div className={b('message-container')}>Empty</div>;
    }

    return (
        <div className={b()}>
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
            </div>
        </div>
    );
};

export default Describe;
