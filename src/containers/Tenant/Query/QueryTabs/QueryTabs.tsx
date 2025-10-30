import {Tab, TabList, TabProvider} from '@gravity-ui/uikit';
import {useLocation} from 'react-router-dom';

import {InternalLink} from '../../../../components/InternalLink/InternalLink';
import {getTenantPath, parseQuery} from '../../../../routes';
import {TENANT_QUERY_TABS_ID} from '../../../../store/reducers/tenant/constants';
import type {TenantQueryTab} from '../../../../store/reducers/tenant/types';
import {TenantTabsGroups} from '../../TenantPages';
import i18n from '../i18n';

const newQuery = {
    id: TENANT_QUERY_TABS_ID.newQuery,
    title: i18n('tabs.newQuery'),
};
const history = {
    id: TENANT_QUERY_TABS_ID.history,
    title: i18n('tabs.history'),
};
const saved = {
    id: TENANT_QUERY_TABS_ID.saved,
    title: i18n('tabs.saved'),
};

export const queryEditorTabs = [newQuery, history, saved];

interface QueryEditorTabsProps {
    className?: string;
    activeTab?: TenantQueryTab;
}

export const QueryTabs = ({className, activeTab}: QueryEditorTabsProps) => {
    const location = useLocation();
    const queryParams = parseQuery(location);

    return (
        <div className={className}>
            <TabProvider value={activeTab}>
                <TabList size="l">
                    {queryEditorTabs.map(({id, title}) => {
                        const path = getTenantPath({
                            ...queryParams,
                            [TenantTabsGroups.queryTab]: id,
                        });
                        return (
                            <Tab key={id} value={id}>
                                <InternalLink to={path} as="tab">
                                    {title}
                                </InternalLink>
                            </Tab>
                        );
                    })}
                </TabList>
            </TabProvider>
        </div>
    );
};
