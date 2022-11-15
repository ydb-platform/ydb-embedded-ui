import {useCallback} from 'react';
import {useDispatch} from 'react-redux';
import cn from 'bem-cn-lite';
// @ts-ignore
import JSONTree from 'react-json-inspector';
import 'react-json-inspector/json-inspector.css';

import {Loader} from '@gravity-ui/uikit';

import {prepareQueryError} from '../../../../utils/query';
import {useAutofetcher, useTypedSelector} from '../../../../utils/hooks';
import {getDescribe} from '../../../../store/reducers/describe';

import './Describe.scss';

const b = cn('kv-describe');

const expandMap = new Map();

interface IDescribeProps {
    tenant: string;
}

const Describe = ({tenant}: IDescribeProps) => {
    const dispatch = useDispatch();

    const {currentDescribe, error, loading, wasLoaded} = useTypedSelector(
        (state) => state.describe,
    );

    const {autorefresh, currentSchemaPath} = useTypedSelector((state) => state.schema);

    const fetchData = useCallback(() => {
        const path = currentSchemaPath || tenant;

        dispatch(getDescribe({path}));
    }, [currentSchemaPath, tenant, dispatch]);

    useAutofetcher(fetchData, [fetchData], autorefresh);

    if (loading && !wasLoaded) {
        return (
            <div className={b('loader-container')}>
                <Loader size="m" />
            </div>
        );
    }

    if (error) {
        return <div className={b('message-container', 'error')}>{prepareQueryError(error)}</div>;
    }

    if (!loading && !currentDescribe) {
        return <div className={b('message-container')}>Empty</div>;
    }

    return (
        <div className={b()}>
            <div className={b('result')}>
                <JSONTree
                    data={currentDescribe}
                    className={b('tree')}
                    onClick={({path}: {path: string}) => {
                        const newValue = !(expandMap.get(path) || false);
                        expandMap.set(path, newValue);
                    }}
                    searchOptions={{
                        debounceTime: 300,
                    }}
                    isExpanded={(keypath: string) => {
                        return expandMap.get(keypath) || false;
                    }}
                />
            </div>
        </div>
    );
};

export default Describe;
