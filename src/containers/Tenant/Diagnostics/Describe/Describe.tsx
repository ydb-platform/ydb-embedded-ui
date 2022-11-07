import {useDispatch, useSelector} from 'react-redux';
import cn from 'bem-cn-lite';
// @ts-ignore
import JSONTree from 'react-json-inspector';
import 'react-json-inspector/json-inspector.css';

import {Loader} from '@gravity-ui/uikit';

import {useAutofetcher} from '../../../../utils/hooks';
import {EPathType} from '../../../../types/api/schema';
import {getDescribe} from '../../../../store/reducers/describe';

import {checkIfPathHasNestedChildren} from '../../utils/schema';

import './Describe.scss';

const b = cn('kv-describe');

const expandMap = new Map();

interface IDescribeProps {
    pathType: EPathType;
    tenant: string;
    schemaNestedChildrenPaths?: string[];
}

const Describe = ({pathType, tenant, schemaNestedChildrenPaths}: IDescribeProps) => {
    const dispatch = useDispatch();

    const {currentDescribe, error, loading, wasLoaded} = useSelector(
        (state: any) => state.describe,
    );

    const {
        autorefresh,
        currentSchemaPath,
        loading: schemaLoading,
        wasLoaded: schemaWasLoaded,
    } = useSelector((state: any) => state.schema);

    const hasNested = checkIfPathHasNestedChildren(pathType);

    const fetchData = (resetLoadingState: boolean) => {
        const path = currentSchemaPath || tenant;

        if (hasNested) {
            // Prevent fetch when shema is not loaded
            // as in this case component may lack correct children data that is loaded in shema
            if (!schemaWasLoaded) {
                return;
            }

            if (schemaNestedChildrenPaths && schemaNestedChildrenPaths.length > 0) {
                const paths = [path, ...schemaNestedChildrenPaths];
                dispatch(
                    getDescribe({path: paths}, {resetLoadingState, currentDescribePath: path}),
                );
            } else {
                dispatch(getDescribe({path}, {resetLoadingState, currentDescribePath: path}));
            }
        } else {
            dispatch(getDescribe({path}, {resetLoadingState, currentDescribePath: path}));
        }
    };

    useAutofetcher(
        (isBackground) => fetchData(!isBackground),
        [tenant, currentSchemaPath, schemaWasLoaded, schemaNestedChildrenPaths],
        autorefresh,
    );

    const renderDescribeJson = () => {
        return (
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
        );
    };

    // Schema loads children paths.
    // To prevent rendering describe without children where children are needed,
    // schema loading state is checked here
    if (!wasLoaded || (hasNested && schemaLoading && !schemaWasLoaded)) {
        return (
            <div className={b('loader-container')}>
                <Loader size="m" />
            </div>
        );
    }

    if (error) {
        return <div className={b('message-container')}>{error.data || error}</div>;
    }

    if (!loading && !currentDescribe) {
        return <div className={b('message-container')}>Empty</div>;
    }

    return (
        <div className={b()}>
            <div className={b('result')}>{renderDescribeJson()}</div>
        </div>
    );
};

export default Describe;
