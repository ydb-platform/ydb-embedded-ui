import React from 'react';

import type {MakeItemParams, MenuItem} from '@gravity-ui/navigation';
import {Alert, Popover} from '@gravity-ui/uikit';
import {useRouteMatch} from 'react-router-dom';

import {useComponent} from '../../components/ComponentsProvider/ComponentsProvider';
import {InternalLink} from '../../components/InternalLink';
import routes from '../../routes';
import {selectUser} from '../../store/reducers/authentication/authentication';
import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {useSetting} from '../../store/reducers/settings/useSetting';
import {uiFactory} from '../../uiFactory/uiFactory';
import {cn} from '../../utils/cn';
import {isModifiedClickEvent} from '../../utils/events';
import {useDelayed, useTypedSelector} from '../../utils/hooks';
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
            href,
        }: {
            wrapperCnParams: Record<string, boolean>;
            buttonCnParams: Record<string, boolean>;
            makeItem: (p: MakeItemParams) => React.ReactNode;
            makeItemParams: MakeItemParams;
            href: string;
        }) => {
            // span1: full width wrapper to ensure proper button position
            // span2: wrapper with additional background and animation
            // span3: button wrapper for proper active and hover colors
            // Capture phase fires on the anchor BEFORE the inner makeItem button's
            // onClick. For modifier-clicks (cmd/ctrl/shift/alt) and middle-clicks
            // we stop propagation so the inner button doesn't fire onItemClick and
            // switch the current page. We don't preventDefault — the browser still
            // follows the href and opens the link in a new tab/window.
            const handleClickCapture = (e: React.MouseEvent<HTMLAnchorElement>) => {
                if (isModifiedClickEvent(e)) {
                    e.stopPropagation();
                }
            };

            const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                if (isModifiedClickEvent(e)) {
                    return;
                }
                // For a regular click, suppress full-page navigation: the underlying
                // makeItem button handles in-app navigation via query params.
                e.preventDefault();
            };

            return (
                <span className={b('nav-item-wrapper')}>
                    <span className={b('nav-item-bg', wrapperCnParams)}>
                        <InternalLink
                            className={b('button-wrapper', buttonCnParams)}
                            to={href}
                            // The inner makeItem button is the real keyboard-focusable
                            // control; remove the anchor from the tab order so Tab
                            // doesn't stop on both the <InternalLink> and the inner button.
                            tabIndex={-1}
                            onClickCapture={handleClickCapture}
                            onClick={handleClick}
                        >
                            {makeItem(makeItemParams)}
                        </InternalLink>
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
                                    href: item.path,
                                })}
                            </Popover>
                        );
                    }

                    return renderNavItem({
                        wrapperCnParams,
                        buttonCnParams,
                        makeItem,
                        makeItemParams: params,
                        href: item.path,
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
