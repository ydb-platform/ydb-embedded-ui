import React from 'react';

import JSONTree from 'react-json-inspector';
import {shallowEqual} from 'react-redux';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {Loader} from '../../../../components/Loader';
import {
    getDescribe,
    getDescribeBatched,
    setCurrentDescribePath,
    setDataWasNotLoaded,
} from '../../../../store/reducers/describe';
import {selectSchemaMergedChildrenPaths} from '../../../../store/reducers/schema/schema';
import type {EPathType} from '../../../../types/api/schema';
import {cn} from '../../../../utils/cn';
import {useAutofetcher, useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
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
    const dispatch = useTypedDispatch();

    const {currentDescribe, error, loading, wasLoaded} = useTypedSelector(
        (state) => state.describe,
    );

    const [preparedDescribeData, setPreparedDescribeData] = React.useState<Object>();

    React.useEffect(() => {
        if (currentDescribe) {
            const paths = Object.keys(currentDescribe);

            if (paths.length === 1) {
                setPreparedDescribeData(currentDescribe[paths[0]]);
            } else {
                setPreparedDescribeData(currentDescribe);
            }
        }
    }, [currentDescribe]);

    const {autorefresh, currentSchemaPath} = useTypedSelector((state) => state.schema);

    const isEntityWithMergedImpl = isEntityWithMergedImplementation(type);

    const mergedChildrenPaths = useTypedSelector(
        (state) => selectSchemaMergedChildrenPaths(state, currentSchemaPath, type),
        shallowEqual,
    );

    const fetchData = React.useCallback(
        (isBackground: boolean) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }

            const path = currentSchemaPath || tenant;
            dispatch(setCurrentDescribePath(path));

            if (!isEntityWithMergedImpl) {
                dispatch(getDescribe({path}));
            } else if (mergedChildrenPaths) {
                dispatch(getDescribeBatched([path, ...mergedChildrenPaths]));
            }
        },
        [currentSchemaPath, tenant, mergedChildrenPaths, isEntityWithMergedImpl, dispatch],
    );

    useAutofetcher(fetchData, [fetchData], autorefresh);

    if ((loading && !wasLoaded) || (isEntityWithMergedImpl && !mergedChildrenPaths)) {
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
