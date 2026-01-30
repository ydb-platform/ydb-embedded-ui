import React from 'react';

import {useRouteMatch} from 'react-router-dom';

import {useComponent} from '../../components/ComponentsProvider/ComponentsProvider';
import routes from '../../routes';
import {selectUser} from '../../store/reducers/authentication/authentication';
import {useTypedSelector} from '../../utils/hooks';
import {useTenantNavigation} from '../Tenant/TenantNavigation/useTenantNavigation';
import {useNavigationV2Enabled} from '../Tenant/utils/useNavigationV2Enabled';
import {UserSettings} from '../UserSettings/UserSettings';
import type {YDBEmbeddedUISettings} from '../UserSettings/settings';

import {YdbInternalUser} from './YdbInternalUser/YdbInternalUser';

interface NavigationProps {
    userSettings: YDBEmbeddedUISettings;
    children: React.ReactNode;
}
export function Navigation({children, userSettings}: NavigationProps) {
    const AsideNavigation = useComponent('AsideNavigation');
    const match = useRouteMatch(routes.tenant);
    const tenantNavigationItems = useTenantNavigation();
    const isV2Enabled = useNavigationV2Enabled();

    const ydbUser = useTypedSelector(selectUser);

    const menuItems = React.useMemo(() => {
        if (!match || !isV2Enabled) {
            return undefined;
        }

        return tenantNavigationItems.map((item) => ({
            id: item.id,
            title: item.title,
            icon: item.icon,
            current: item.current,
            onItemClick: item.onForward,
        }));
    }, [match, isV2Enabled, tenantNavigationItems]);

    return (
        <AsideNavigation
            settings={<UserSettings settings={userSettings} />}
            ydbInternalUser={<YdbInternalUser login={ydbUser} />}
            user={ydbUser ? {login: ydbUser} : undefined}
            menuItems={menuItems}
            content={children}
        />
    );
}
