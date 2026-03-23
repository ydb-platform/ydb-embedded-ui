import React from 'react';

import {Helmet} from 'react-helmet-async';

import {useQueriesHistory} from '../../../store/reducers/query/hooks';
import {changeUserInput} from '../../../store/reducers/query/query';
import {TENANT_QUERY_TABS_ID} from '../../../store/reducers/tenant/constants';
import {cn} from '../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../utils/hooks';
import {useNavigationV2Enabled} from '../utils/useNavigationV2Enabled';

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

    const isV2NavigationEnabled = useNavigationV2Enabled();

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
                return <QueriesHistory queriesHistory={queriesHistory} />;
            }
            case TENANT_QUERY_TABS_ID.saved: {
                return <SavedQueries />;
            }
            default: {
                return null;
            }
        }
    };

    return (
        <div className={b({'with-top-navigation': !isV2NavigationEnabled})}>
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
