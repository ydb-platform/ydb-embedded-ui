import React from 'react';

import type {MakeItemParams, MenuItem} from '@gravity-ui/navigation';
import {Alert, Popover} from '@gravity-ui/uikit';
import {useRouteMatch} from 'react-router-dom';

import {useComponent} from '../../components/ComponentsProvider/ComponentsProvider';
import routes from '../../routes';
import {selectUser} from '../../store/reducers/authentication/authentication';
import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {useSetting} from '../../store/reducers/settings/useSetting';
import {cn} from '../../utils/cn';
import {useTypedSelector} from '../../utils/hooks';
import {useTenantNavigation} from '../Tenant/TenantNavigation/useTenantNavigation';
import {useNavigationV2Enabled} from '../Tenant/utils/useNavigationV2Enabled';
import {UserSettings} from '../UserSettings/UserSettings';
import type {YDBEmbeddedUISettings} from '../UserSettings/settings';

import {YdbInternalUser} from './YdbInternalUser/YdbInternalUser';
import i18n from './i18n';

import './Navigation.scss';

const b = cn('ydb-navigation-wrapper');

interface NavigationProps {
    userSettings: YDBEmbeddedUISettings;
    children: React.ReactNode;
}

export function Navigation({children, userSettings}: NavigationProps) {
    const AsideNavigation = useComponent('AsideNavigation');

    const match = useRouteMatch(routes.tenant);
    const isDatabasePage = Boolean(match);

    const tenantNavigationItems = useTenantNavigation();
    const isV2Enabled = useNavigationV2Enabled();
    const {
        value: isV2NavigationAlertSeen,
        saveValue: setIsV2NavigationAlertSeen,
        isLoading: isNotificationSettingLoading,
    } = useSetting(SETTING_KEYS.IS_V2_NAVIGATION_ALERT_SEEN);

    const ydbUser = useTypedSelector(selectUser);

    const shouldShowNewNavAlert =
        isV2Enabled && !isV2NavigationAlertSeen && !isNotificationSettingLoading;
    const [isNewNavAlertReady, setIsNewNavAlertReady] = React.useState(false);

    React.useEffect(() => {
        if (!isDatabasePage || !shouldShowNewNavAlert) {
            setIsNewNavAlertReady(false);
            return undefined;
        }

        const timerId = window.setTimeout(() => {
            setIsNewNavAlertReady(true);
        }, 2_000);

        return () => {
            window.clearTimeout(timerId);
        };
    }, [isDatabasePage, shouldShowNewNavAlert]);

    const isNewNavAlertShown = shouldShowNewNavAlert && isNewNavAlertReady;

    const handleNewNavAlertClose = React.useCallback(() => {
        setIsV2NavigationAlertSeen(true);
    }, [setIsV2NavigationAlertSeen]);

    const menuItems = React.useMemo(() => {
        if (!isDatabasePage || !isV2Enabled) {
            return undefined;
        }

        const renderNavItem = ({
            wrapperCnParams,
            buttonCnParams,
            makeItem,
            makeItemParams,
        }: {
            wrapperCnParams: Record<string, boolean>;
            buttonCnParams: Record<string, boolean>;
            makeItem: (p: MakeItemParams) => React.ReactNode;
            makeItemParams: MakeItemParams;
        }) => {
            // span1: full width wrapper to ensure proper button position
            // span2: wrapper with additional background and animation
            // span3: button wrapper for proper active and hover colors
            return (
                <span className={b('nav-item-wrapper')}>
                    <span className={b('nav-item-bg', wrapperCnParams)}>
                        <span className={b('button-wrapper', buttonCnParams)}>
                            {makeItem(makeItemParams)}
                        </span>
                    </span>
                </span>
            );
        };

        return tenantNavigationItems.map((item) => {
            const navigationItem: MenuItem = {
                id: item.id,
                title: item.title,
                icon: item.icon,
                current: item.current,
                onItemClick: item.onForward,
                tooltipText: item.title,
                itemWrapper: (params, makeItem, options) => {
                    const baseCnParams = {
                        compact: options.compact,
                        expanded: !options.compact,
                        diagnostics: item.id === 'diagnostics',
                        schema: item.id === 'schema',
                        query: item.id === 'query',
                    };

                    const wrapperCnParams = {
                        ...baseCnParams,
                        // TODO: animation should be shown for two weeks after a release
                        // Probably should be sync with new navigation notification when it is added
                        // https://github.com/ydb-platform/ydb-embedded-ui/issues/3587
                        ['with-animation']: true,
                    };
                    const buttonCnParams = {
                        ...baseCnParams,
                        active: item.current,
                    };

                    if (item.id === 'diagnostics') {
                        return (
                            <Popover
                                open={isNewNavAlertShown}
                                className={b('popover')}
                                hasArrow
                                placement={['right-start']}
                                onOpenChange={(open) => {
                                    if (!open) {
                                        handleNewNavAlertClose();
                                    }
                                }}
                                content={
                                    <Alert
                                        theme="clear"
                                        layout="vertical"
                                        icon={null}
                                        title={i18n('alert.new-nav-title')}
                                        message={i18n('alert.new-nav-message')}
                                        onClose={handleNewNavAlertClose}
                                        actions={
                                            <Alert.Action
                                                view="normal-contrast"
                                                className={b('alert-button')}
                                                onClick={handleNewNavAlertClose}
                                            >
                                                {i18n('alert.button-got-it')}
                                            </Alert.Action>
                                        }
                                    />
                                }
                            >
                                {renderNavItem({
                                    wrapperCnParams,
                                    buttonCnParams,
                                    makeItem,
                                    makeItemParams: params,
                                })}
                            </Popover>
                        );
                    }

                    return renderNavItem({
                        wrapperCnParams,
                        buttonCnParams,
                        makeItem,
                        makeItemParams: params,
                    });
                },
            };

            return navigationItem;
        });
    }, [
        isDatabasePage,
        isV2Enabled,
        isNewNavAlertShown,
        tenantNavigationItems,
        handleNewNavAlertClose,
    ]);

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
