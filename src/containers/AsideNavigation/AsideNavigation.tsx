import React, {useEffect, useState} from 'react';
import {connect} from 'react-redux';
import {useLocation} from 'react-router';
import {useHistory} from 'react-router-dom';
import cn from 'bem-cn-lite';

import {Icon, Button} from '@gravity-ui/uikit';
import {AsideHeader, MenuItem as AsideHeaderMenuItem, FooterItem} from '@gravity-ui/navigation';

import signOutIcon from '../../assets/icons/signOut.svg';
import signInIcon from '../../assets/icons/signIn.svg';
import databaseIcon from '../../assets/icons/server.svg';
import storageIcon from '../../assets/icons/storage.svg';
import clusterIcon from '../../assets/icons/cluster.svg';
import ydbLogoIcon from '../../assets/icons/ydb.svg';
import databasesIcon from '../../assets/icons/databases.svg';
import userSecret from '../../assets/icons/user-secret.svg';
import userChecked from '../../assets/icons/user-check.svg';
import settingsIcon from '../../assets/icons/settings.svg';
import supportIcon from '../../assets/icons/support.svg';

import UserSettings from '../UserSettings/UserSettings';

import routes, {createHref, CLUSTER_PAGES} from '../../routes';

import {logout, setIsNotAuthenticated} from '../../store/reducers/authentication';
import {getSettingValue, setSettingValue} from '../../store/reducers/settings';

import {ASIDE_HEADER_COMPACT_KEY} from '../../utils/constants';

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
    setIsNotAuthenticated: VoidFunction;
}

function YbdInternalUser({ydbUser, logout, setIsNotAuthenticated}: YbdInternalUserProps) {
    return (
        <div className={b('internal-user')}>
            <div className={b('user-info-wrapper')}>
                <div className={b('ydb-internal-user-title')}>YDB user</div>
                {ydbUser && <div className={b('username')}>{ydbUser}</div>}
            </div>
            {ydbUser ? (
                <Button view="flat-secondary" onClick={logout} title="logout">
                    <Icon data={signOutIcon} size={16} />
                </Button>
            ) : (
                <Button view="flat-secondary" onClick={setIsNotAuthenticated} title="login">
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
        setIsNotAuthenticated: VoidFunction;
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
                title: ydbUser?.login ?? 'Account',
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
                    <YbdInternalUser
                        ydbUser={ydbUser.login}
                        logout={ydbUser.logout}
                        setIsNotAuthenticated={ydbUser.setIsNotAuthenticated}
                    />
                </div>
            )}
        />
    );
}

interface AsideNavigationProps {
    children: React.ReactNode;
    ydbUser: string;
    compact: boolean;
    logout: VoidFunction;
    setIsNotAuthenticated: VoidFunction;
    setSettingValue: (name: string, value: string) => void;
}

const items: MenuItem[] = [
    {
        id: CLUSTER_PAGES.tenants.id,
        title: 'Databases',
        icon: databasesIcon,
        iconSize: 20,
        location: createHref(routes.cluster, {
            activeTab: CLUSTER_PAGES.tenants.id,
        }),
        locationKeys: ['/tenant'],
    },
    {
        id: CLUSTER_PAGES.nodes.id,
        title: 'Nodes',
        icon: databaseIcon,
        iconSize: 20,
        location: createHref(routes.cluster, {activeTab: CLUSTER_PAGES.nodes.id}),
        locationKeys: ['/node'],
    },
    {
        id: CLUSTER_PAGES.storage.id,
        title: 'Storage',
        icon: storageIcon,
        iconSize: 20,
        location: createHref(routes.cluster, {
            activeTab: CLUSTER_PAGES.storage.id,
        }),
        locationKeys: ['/storage'],
    },
    {
        id: CLUSTER_PAGES.cluster.id,
        title: 'Cluster',
        icon: clusterIcon,
        iconSize: 20,
        location: createHref(routes.cluster, {
            activeTab: CLUSTER_PAGES.cluster.id,
        }),
        locationKeys: ['/cluster/cluster'],
    },
];

enum Panel {
    UserSettings = 'UserSettings',
}

function AsideNavigation(props: AsideNavigationProps) {
    const location = useLocation();
    const history = useHistory();

    const [visiblePanel, setVisiblePanel] = useState<Panel>();

    const setIsCompact = (compact: boolean) => {
        props.setSettingValue(ASIDE_HEADER_COMPACT_KEY, JSON.stringify(compact));
    };

    // navigation managed its compact state internally before, and its approach is not compatible with settings
    // to migrate, save the incoming value again; save only `false` because `true` is the default value
    // assume it is safe to remove this code block if it is at least a few months old
    // there a two of these, search for a similar comment
    useEffect(() => {
        if (props.compact === false) {
            setIsCompact(props.compact);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const menuItems: AsideHeaderMenuItem[] = React.useMemo(() => {
        const {pathname} = location;
        const isClusterPage = pathname === '/cluster';
        const menuItems: AsideHeaderMenuItem[] = items.map((item) => {
            const locationKeysCoincidence = item.locationKeys?.filter((key) =>
                pathname.startsWith(key),
            );
            let current =
                (locationKeysCoincidence && locationKeysCoincidence.length > 0) ||
                item.location.startsWith(pathname);
            if (isClusterPage && item.id !== CLUSTER_PAGES.tenants.id) {
                current = false;
            }
            return {
                id: item.id,
                title: item.title,
                icon: item.icon,
                iconSize: item.iconSize,
                current,
                onItemClick: () => {
                    history.push(item.location);
                },
            };
        });
        return menuItems;
    }, [location, history]);

    return (
        <React.Fragment>
            <AsideHeader
                logo={{
                    text: 'YDB',
                    icon: ydbLogoIcon,
                    onClick: () => history.push('/'),
                }}
                menuItems={menuItems}
                compact={props.compact}
                onChangeCompact={setIsCompact}
                className={b()}
                renderContent={() => props.children}
                renderFooter={({compact, asideRef}) => (
                    <React.Fragment>
                        <FooterItem
                            compact={compact}
                            item={{
                                id: 'documentation',
                                title: 'Documentation',
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
                                title: 'Settings',
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
                                login: props.ydbUser,
                                logout: props.logout,
                                setIsNotAuthenticated: props.setIsNotAuthenticated,
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

const mapStateToProps = (state: any) => {
    const {user: ydbUser} = state.authentication;

    return {
        ydbUser,
        compact: JSON.parse(getSettingValue(state, ASIDE_HEADER_COMPACT_KEY)),
    };
};

const mapDispatchToProps = {
    logout,
    setIsNotAuthenticated,
    setSettingValue,
};

export default connect(mapStateToProps, mapDispatchToProps)(AsideNavigation);
