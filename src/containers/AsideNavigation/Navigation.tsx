import React from 'react';

import type {AsideHeaderItem, MakeItemParams} from '@gravity-ui/navigation';
import {Alert, Popover} from '@gravity-ui/uikit';
import {useRouteMatch} from 'react-router-dom';

import {useComponent} from '../../components/ComponentsProvider/ComponentsProvider';
import routes from '../../routes';
import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {useSetting} from '../../store/reducers/settings/useSetting';
import {uiFactory} from '../../uiFactory/uiFactory';
import {cn} from '../../utils/cn';
import {isModifiedClickEvent} from '../../utils/events';
import {useDelayed} from '../../utils/hooks';
import {useUser} from '../../utils/hooks/useWhoami';
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

    const ydbUser = useUser();

    const shouldShowV2NavNotifications = !uiFactory.hideNewFeaturesNotifications?.navigationV2;

    const shouldShowNewNavAlert =
        shouldShowV2NavNotifications &&
        isV2Enabled &&
        isDatabasePage &&
        !isV2NavigationAlertSeen &&
        !isNotificationSettingLoading;
    const [isNewNavAlertReady] = useDelayed(2_000, shouldShowNewNavAlert);

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
            // span3: styling-only wrapper for active/hover colors.
            //   The actual interactive element is the <a> produced by makeItem
            //   (because we pass `href` on the AsideHeaderItem), so we don't wrap it in
            //   another <a>/button — that would create nested interactive content.
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
            // makeItem renders the inner element as <a href={item.href}> when `href`
            // is set, which gives us real link semantics for free (hover preview,
            // cmd+click → open in new tab, copy link address, right-click menu).
            // The onItemClick handler still fires on every primary click and lets us
            // do the in-app navigation (query-param update) without a full reload.
            // For modifier/middle-clicks we bail out so the browser handles the
            // anchor natively without our SPA handler also switching the current page.
            const handleItemClick = (
                _menuItem: AsideHeaderItem,
                _collapsed: boolean,
                event: React.MouseEvent<HTMLElement>,
            ) => {
                if (isModifiedClickEvent(event)) {
                    return;
                }
                event.preventDefault();
                item.onForward();
            };

            const navigationItem: AsideHeaderItem = {
                id: item.id,
                title: item.title,
                icon: item.icon,
                current: item.current,
                href: item.path,
                onItemClick: handleItemClick,
                tooltipText: item.title,
                itemWrapper: (params, makeItem, options) => {
                    const baseCnParams = {
                        compact: options.compact,
                        expanded: !options.compact,
                        database: item.id === 'database',
                        diagnostics: item.id === 'diagnostics',
                        query: item.id === 'query',
                    };

                    const wrapperCnParams = {
                        ...baseCnParams,
                        ['with-animation']: shouldShowV2NavNotifications,
                    };
                    const buttonCnParams = {
                        ...baseCnParams,
                        active: item.current,
                    };

                    if (item.id === 'database') {
                        return (
                            <Popover
                                open={isNewNavAlertShown}
                                className={b('popover')}
                                hasArrow
                                placement={['right-start']}
                                onOpenChange={(open, _, reason) => {
                                    const isValidCloseReason =
                                        reason === 'outside-press' || reason === 'escape-key';

                                    if (!open && isValidCloseReason) {
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
        shouldShowV2NavNotifications,
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
