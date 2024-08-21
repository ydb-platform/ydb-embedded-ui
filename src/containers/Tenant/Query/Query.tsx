import React from 'react';

import {Helmet} from 'react-helmet-async';

import NotRenderUntilFirstVisible from '../../../components/NotRenderUntilFirstVisible/NotRenderUntilFirstVisible';
import {changeUserInput} from '../../../store/reducers/executeQuery';
import {TENANT_QUERY_TABS_ID} from '../../../store/reducers/tenant/constants';
import type {EPathType} from '../../../types/api/schema';
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
    tenantName: string;
    path: string;
    type?: EPathType;
}

export const Query = (props: QueryProps) => {
    const dispatch = useTypedDispatch();

    const {queryTab = TENANT_QUERY_TABS_ID.newQuery} = useTypedSelector((state) => state.tenant);

    const handleUserInputChange = (value: {input: string}) => {
        dispatch(changeUserInput(value));
    };

    const activeTab = React.useMemo(
        () => queryEditorTabs.find(({id}) => id === queryTab),
        [queryTab],
    );

    const renderContent = () => {
        return (
            <React.Fragment>
                <NotRenderUntilFirstVisible show={queryTab === TENANT_QUERY_TABS_ID.newQuery}>
                    <QueryEditor changeUserInput={handleUserInputChange} {...props} />
                </NotRenderUntilFirstVisible>
                <NotRenderUntilFirstVisible show={queryTab === TENANT_QUERY_TABS_ID.history}>
                    <QueriesHistory changeUserInput={handleUserInputChange} />
                </NotRenderUntilFirstVisible>
                <NotRenderUntilFirstVisible show={queryTab === TENANT_QUERY_TABS_ID.saved}>
                    <SavedQueries changeUserInput={handleUserInputChange} />
                </NotRenderUntilFirstVisible>
            </React.Fragment>
        );
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
