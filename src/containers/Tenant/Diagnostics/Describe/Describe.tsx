import {useEffect} from 'react';
import cn from 'bem-cn-lite';
import {useDispatch, useSelector} from 'react-redux';
import {Loader} from '@gravity-ui/uikit';
import 'react-json-inspector/json-inspector.css';
// @ts-ignore
import JSONTree from 'react-json-inspector';

import {getDescribe} from '../../../../store/reducers/describe';
import {useAutofetcher} from '../../../../utils/hooks';

import './Describe.scss';

const b = cn('kv-describe');

const expandMap = new Map();

interface IDescribeProps {
    tenant: string;
}

const Describe = ({tenant}: IDescribeProps) => {
    const dispatch = useDispatch();

    const {
        currentDescribe: data,
        error,
        loading,
        wasLoaded,
    } = useSelector((state: any) => state.describe);
    const {autorefresh, currentSchemaPath} = useSelector((state: any) => state.schema);

    const fetchData = () => {
        const path = currentSchemaPath || tenant;
        dispatch(getDescribe({path}));
    };

    useAutofetcher(fetchData, [], autorefresh);

    useEffect(() => {
        fetchData();
    }, [currentSchemaPath]);

    const renderDescribeJson = () => {
        return (
            <JSONTree
                data={data}
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
        );
    };

    if (loading && !wasLoaded) {
        return (
            <div className={b('loader-container')}>
                <Loader size="m" />
            </div>
        );
    }

    if (error) {
        return <div className={b('message-container')}>{error.data || error}</div>;
    }

    if (!loading && !data) {
        return <div className={b('message-container')}>Empty</div>;
    }

    return (
        <div className={b()}>
            <div className={b('result')}>{renderDescribeJson()}</div>
        </div>
    );
};

export default Describe;
