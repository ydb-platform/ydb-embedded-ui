import React from 'react';

import {Helmet} from 'react-helmet-async';

import {useQueriesHistory} from '../../../store/reducers/query/hooks';
import {changeUserInput} from '../../../store/reducers/query/query';
import {TENANT_QUERY_TABS_ID} from '../../../store/reducers/tenant/constants';
import {cn} from '../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../utils/hooks';

import QueriesHistory from './QueriesHistory/QueriesHistory';
import QueryEditor from './QueryEditor/QueryEditor';
import {QueryTabs, queryEditorTabs} from './QueryTabs/QueryTabs';
import {SavedQueries} from './SavedQueries/SavedQueries';

import './Query.scss';

const b = cn('ydb-query');

interface QueryProps {
    theme: string;
}

export const Query = (props: QueryProps) => {
    const dispatch = useTypedDispatch();

    const {queryTab = TENANT_QUERY_TABS_ID.newQuery} = useTypedSelector((state) => state.tenant);

    const queriesHistory = useQueriesHistory();

    const handleUserInputChange = (value: {input: string}) => {
        dispatch(changeUserInput(value));
    };

    const activeTab = React.useMemo(
        () => queryEditorTabs.find(({id}) => id === queryTab),
        [queryTab],
    );

    const renderContent = () => {
        switch (queryTab) {
            case TENANT_QUERY_TABS_ID.newQuery: {
                return (
                    <QueryEditor
                        changeUserInput={handleUserInputChange}
                        queriesHistory={queriesHistory}
                        {...props}
                    />
                );
            }
            case TENANT_QUERY_TABS_ID.history: {
                return (
                    <QueriesHistory
                        changeUserInput={handleUserInputChange}
                        queriesHistory={queriesHistory}
                    />
                );
            }
            case TENANT_QUERY_TABS_ID.saved: {
                return <SavedQueries changeUserInput={handleUserInputChange} />;
            }
            default: {
                return null;
            }
        }
    };

    return (
        <div className={b()}>
            {activeTab ? (
                <Helmet>
                    <title>{activeTab.title}</title>
                </Helmet>
            ) : null}
            <QueryTabs className={b('tabs')} activeTab={queryTab} />
            <div className={b('content')}>{renderContent()}</div>
        </div>
    );
};
