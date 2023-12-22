import React, {useState} from 'react';
import {useDispatch} from 'react-redux';
import {useLocation} from 'react-router';
import {useHistory} from 'react-router-dom';
import cn from 'bem-cn-lite';

import {Icon, Button} from '@gravity-ui/uikit';
import {AsideHeader, MenuItem as AsideHeaderMenuItem, FooterItem} from '@gravity-ui/navigation';

import terminalIcon from '@gravity-ui/icons/svgs/terminal.svg';
import pulseIcon from '@gravity-ui/icons/svgs/pulse.svg';

import signOutIcon from '../../assets/icons/signOut.svg';
import signInIcon from '../../assets/icons/signIn.svg';
import ydbLogoIcon from '../../assets/icons/ydb.svg';
import userSecret from '../../assets/icons/user-secret.svg';
import userChecked from '../../assets/icons/user-check.svg';
import settingsIcon from '../../assets/icons/settings.svg';
import supportIcon from '../../assets/icons/support.svg';

import {logout} from '../../store/reducers/authentication/authentication';
import {TENANT_PAGE, TENANT_PAGES_IDS} from '../../store/reducers/tenant/constants';
import routes, {TENANT, createHref, parseQuery} from '../../routes';
import {useSetting, useTypedSelector} from '../../utils/hooks';
import {ASIDE_HEADER_COMPACT_KEY, TENANT_INITIAL_PAGE_KEY} from '../../utils/constants';

import {getTenantPath} from '../Tenant/TenantPages';
import {UserSettings} from '../UserSettings/UserSettings';

import i18n from './i18n';
import './AsideNavigation.scss';

const b = cn('kv-navigation');

interface MenuItem {
    id: string;
    title: string;
    icon: SVGIconData;
    iconSize: string | number;
    location: string;
    locationKeys?: string[];
}

interface YbdInternalUserProps {
    ydbUser?: string;
    logout: VoidFunction;
}

function YbdInternalUser({ydbUser, logout}: YbdInternalUserProps) {
    const history = useHistory();

    const handleLoginClick = () => {
        history.push(
            createHref(routes.auth, undefined, {returnUrl: encodeURIComponent(location.href)}),
        );
    };

    return (
        <div className={b('internal-user')}>
            <div className={b('user-info-wrapper')}>
                <div className={b('ydb-internal-user-title')}>{i18n('account.user')}</div>
                {ydbUser && <div className={b('username')}>{ydbUser}</div>}
            </div>
            {ydbUser ? (
                <Button view="flat-secondary" title={i18n('account.logout')} onClick={logout}>
                    <Icon data={signOutIcon} size={16} />
                </Button>
            ) : (
                <Button
                    view="flat-secondary"
                    title={i18n('account.login')}
                    onClick={handleLoginClick}
                >
                    <Icon data={signInIcon} size={16} />
                </Button>
            )}
        </div>
    );
}

interface YdbUserDropdownProps {
    isCompact: boolean;
    ydbUser: {
        login?: string;
        logout: VoidFunction;
    };
    popupAnchor: React.RefObject<HTMLDivElement>;
}

function YdbUserDropdown({isCompact, popupAnchor, ydbUser}: YdbUserDropdownProps) {
    const [isUserDropdownVisible, setIsUserDropdownVisible] = useState(false);
    const iconData = ydbUser?.login ? userChecked : userSecret;
    return (
        <FooterItem
            compact={isCompact}
            item={{
                id: 'user-popup',
                title: ydbUser?.login ?? i18n('navigation-item.account'),
                current: isUserDropdownVisible,
                icon: iconData,
                iconSize: 22,
                onItemClick: () => setIsUserDropdownVisible(true),
            }}
            enableTooltip={!isUserDropdownVisible}
            popupAnchor={popupAnchor}
            popupVisible={isUserDropdownVisible}
            onClosePopup={() => setIsUserDropdownVisible(false)}
            renderPopupContent={() => (
                <div className={b('ydb-user-wrapper')}>
                    <YbdInternalUser ydbUser={ydbUser.login} logout={ydbUser.logout} />
                </div>
            )}
        />
    );
}

interface AsideNavigationProps {
    children: React.ReactNode;
}

enum Panel {
    UserSettings = 'UserSettings',
}

export const useGetLeftNavigationItems = () => {
    const location = useLocation();
    const history = useHistory();

    const [initialTenantPage, setInitialTenantPage] = useSetting<string>(TENANT_INITIAL_PAGE_KEY);
    const {tenantPage = initialTenantPage} = useTypedSelector((state) => state.tenant);

    const {pathname} = location;
    const queryParams = parseQuery(location);

    const isTenantPage = pathname === `/${TENANT}`;

    const menuItems: AsideHeaderMenuItem[] = React.useMemo(() => {
        if (!isTenantPage) {
            return [];
        }

        const items: MenuItem[] = [
            {
                id: TENANT_PAGES_IDS.query,
                title: i18n('pages.query'),
                icon: terminalIcon,
                iconSize: 20,
                location: getTenantPath({
                    ...queryParams,
                    [TENANT_PAGE]: TENANT_PAGES_IDS.query,
                }),
            },
            {
                id: TENANT_PAGES_IDS.diagnostics,
                title: i18n('pages.diagnostics'),
                icon: pulseIcon,
                iconSize: 20,
                location: getTenantPath({
                    ...queryParams,
                    [TENANT_PAGE]: TENANT_PAGES_IDS.diagnostics,
                }),
            },
        ];

        return items.map((item) => {
            const current = item.id === tenantPage;

            return {
                id: item.id,
                title: item.title,
                icon: item.icon,
                iconSize: item.iconSize,
                current,
                onItemClick: () => {
                    setInitialTenantPage(item.id);
                    history.push(item.location);
                },
            };
        });
    }, [tenantPage, isTenantPage, setInitialTenantPage, history, queryParams]);

    return menuItems;
};

function AsideNavigation(props: AsideNavigationProps) {
    const history = useHistory();
    const dispatch = useDispatch();

    const [visiblePanel, setVisiblePanel] = useState<Panel>();

    const {user: ydbUser} = useTypedSelector((state) => state.authentication);
    const [compact, setIsCompact] = useSetting<boolean>(ASIDE_HEADER_COMPACT_KEY);

    const menuItems = useGetLeftNavigationItems();

    const onLogout = () => {
        dispatch(logout());
    };

    return (
        <React.Fragment>
            <AsideHeader
                logo={{
                    text: 'YDB',
                    icon: ydbLogoIcon,
                    onClick: () => history.push('/'),
                }}
                menuItems={menuItems}
                compact={compact}
                onChangeCompact={setIsCompact}
                className={b()}
                renderContent={() => props.children}
                renderFooter={({compact, asideRef}) => (
                    <React.Fragment>
                        <FooterItem
                            compact={compact}
                            item={{
                                id: 'documentation',
                                title: i18n('navigation-item.documentation'),
                                icon: supportIcon,
                                iconSize: 24,
                                onItemClick: () => {
                                    window.open('https://ydb.tech/docs', '_blank', 'noreferrer');
                                },
                            }}
                        />

                        <FooterItem
                            item={{
                                id: 'user-settings',
                                title: i18n('navigation-item.settings'),
                                icon: settingsIcon,
                                iconSize: 24,
                                current: visiblePanel === Panel.UserSettings,
                                onItemClick: () => {
                                    setVisiblePanel(
                                        visiblePanel === Panel.UserSettings
                                            ? undefined
                                            : Panel.UserSettings,
                                    );
                                },
                            }}
                            compact={compact}
                        />

                        <YdbUserDropdown
                            isCompact={compact}
                            popupAnchor={asideRef}
                            ydbUser={{
                                login: ydbUser,
                                logout: onLogout,
                            }}
                        />
                    </React.Fragment>
                )}
                panelItems={[
                    {
                        id: 'user-settings',
                        visible: visiblePanel === Panel.UserSettings,
                        content: <UserSettings />,
                    },
                ]}
                onClosePanel={() => {
                    setVisiblePanel(undefined);
                }}
            />
        </React.Fragment>
    );
}

export default AsideNavigation;
