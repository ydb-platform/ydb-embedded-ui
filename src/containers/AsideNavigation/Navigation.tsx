import React from 'react';

import type {MenuItem} from '@gravity-ui/navigation';
import {useRouteMatch} from 'react-router-dom';

import {useComponent} from '../../components/ComponentsProvider/ComponentsProvider';
import routes from '../../routes';
import {selectUser} from '../../store/reducers/authentication/authentication';
import {cn} from '../../utils/cn';
import {useTypedSelector} from '../../utils/hooks';
import {useTenantNavigation} from '../Tenant/TenantNavigation/useTenantNavigation';
import {useNavigationV2Enabled} from '../Tenant/utils/useNavigationV2Enabled';
import {UserSettings} from '../UserSettings/UserSettings';
import type {YDBEmbeddedUISettings} from '../UserSettings/settings';

import {YdbInternalUser} from './YdbInternalUser/YdbInternalUser';

import './Navigation.scss';

const b = cn('ydb-navigation-wrapper');

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

        return tenantNavigationItems.map((item) => {
            const navigationItem: MenuItem = {
                id: item.id,
                title: item.title,
                icon: item.icon,
                current: item.current,
                onItemClick: item.onForward,
                tooltipText: item.title,
                itemWrapper: (params, makeItem, options) => {
                    const cnParams = {
                        active: item.current,
                        compact: options.compact,
                        expanded: !options.compact,
                        diagnostics: item.id === 'diagnostics',
                        schema: item.id === 'schema',
                        query: item.id === 'query',
                        // TODO: animation should be shown for two weeks after a release
                        // Probably should be sync with new navigation notification when it is added
                        // https://github.com/ydb-platform/ydb-embedded-ui/issues/3587
                        ['with-animation']: true,
                    };

                    // span1: full width wrapper to ensure proper button position
                    // span2: wrapper with additional background and animation
                    // span3: button wrapper for proper active and hover colors
                    return (
                        <span className={b('nav-item-wrapper')}>
                            <span className={b('nav-item-bg', cnParams)}>
                                <span className={b('button-wrapper', cnParams)}>
                                    {makeItem({
                                        ...params,
                                    })}
                                </span>
                            </span>
                        </span>
                    );
                },
            };

            return navigationItem;
        });
    }, [match, isV2Enabled, tenantNavigationItems]);

    return (
        <AsideNavigation
            settings={<UserSettings settings={userSettings} />}
            ydbInternalUser={<YdbInternalUser login={ydbUser} />}
            user={ydbUser ? {login: ydbUser} : undefined}
            menuItems={menuItems}
            content={children}
            className={b()}
        />
    );
}
