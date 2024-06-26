import React from 'react';

import {Helmet} from 'react-helmet-async';

import {changeUserInput} from '../../../store/reducers/executeQuery';
import {TENANT_QUERY_TABS_ID} from '../../../store/reducers/tenant/constants';
import type {EPathType} from '../../../types/api/schema';
import type {SavedQuery} from '../../../types/store/query';
import {cn} from '../../../utils/cn';
import {SAVED_QUERIES_KEY} from '../../../utils/constants';
import {useSetting, useTypedDispatch, useTypedSelector} from '../../../utils/hooks';

import QueriesHistory from './QueriesHistory/QueriesHistory';
import QueryEditor from './QueryEditor/QueryEditor';
import {QueryTabs, queryEditorTabs} from './QueryTabs/QueryTabs';
import {SavedQueries} from './SavedQueries/SavedQueries';

import './Query.scss';

const b = cn('ydb-query');

interface QueryProps {
    theme: string;
    tenantName: string;
    path: string;
    type?: EPathType;
}

export const Query = (props: QueryProps) => {
    const dispatch = useTypedDispatch();

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

    const activeTab = React.useMemo(
        () => queryEditorTabs.find(({id}) => id === queryTab),
        [queryTab],
    );

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
