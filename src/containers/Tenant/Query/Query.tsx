import {useDispatch} from 'react-redux';
import block from 'bem-cn-lite';

import type {EPathType} from '../../../types/api/schema';
import type {SavedQuery} from '../../../types/store/query';
import {changeUserInput} from '../../../store/reducers/executeQuery';
import {TENANT_QUERY_TABS_ID} from '../../../store/reducers/tenant/constants';
import {useSetting, useTypedSelector} from '../../../utils/hooks';
import {SAVED_QUERIES_KEY} from '../../../utils/constants';

import {QueryTabs} from './QueryTabs/QueryTabs';
import {SavedQueries} from './SavedQueries/SavedQueries';
import QueriesHistory from './QueriesHistory/QueriesHistory';
import QueryEditor from './QueryEditor/QueryEditor';

import './Query.scss';

const b = block('ydb-query');

interface QueryProps {
    theme: string;
    path: string;
    type: EPathType;
}

export const Query = (props: QueryProps) => {
    const dispatch = useDispatch();

    const {queryTab = TENANT_QUERY_TABS_ID.newQuery} = useTypedSelector((state) => state.tenant);

    const [savedQueries, setSavedQueries] = useSetting<SavedQuery[]>(SAVED_QUERIES_KEY, []);

    const handleDeleteQuery = (queryName: string) => {
        const newSavedQueries = savedQueries.filter(
            (el) => el.name.toLowerCase() !== queryName.toLowerCase(),
        );
        setSavedQueries(newSavedQueries);
    };

    const handleUserInputChange = (value: {input: string}) => {
        dispatch(changeUserInput(value));
    };

    const renderContent = () => {
        switch (queryTab) {
            case TENANT_QUERY_TABS_ID.newQuery: {
                return <QueryEditor changeUserInput={handleUserInputChange} {...props} />;
            }
            case TENANT_QUERY_TABS_ID.history: {
                return <QueriesHistory changeUserInput={handleUserInputChange} />;
            }
            case TENANT_QUERY_TABS_ID.saved: {
                return (
                    <SavedQueries
                        changeUserInput={handleUserInputChange}
                        savedQueries={savedQueries}
                        onDeleteQuery={handleDeleteQuery}
                    />
                );
            }
            default: {
                return null;
            }
        }
    };

    return (
        <div className={b()}>
            <QueryTabs className={b('tabs')} activeTab={queryTab} />
            <div className={b('content')}>{renderContent()}</div>
        </div>
    );
};
