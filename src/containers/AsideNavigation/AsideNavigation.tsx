import React, {useState} from 'react';
import {useHistory} from 'react-router-dom';
import cn from 'bem-cn-lite';
import {useLocation} from 'react-router';
import {connect} from 'react-redux';

import {
    AsideHeader,
    AsideHeaderFooterItem,
    AsideHeaderMenuItem,
    SlotName,
} from '../../components/AsideNavigation/AsideHeader';
import {Icon, Button} from '@gravity-ui/uikit';
import signOutIcon from '../../assets/icons/signOut.svg';
import signInIcon from '../../assets/icons/signIn.svg';
import databaseIcon from '../../assets/icons/server.svg';
import storageIcon from '../../assets/icons/storage.svg';
import clusterIcon from '../../assets/icons/cluster.svg';
import ydbLogoIcon from '../../assets/icons/ydb.svg';
import databasesIcon from '../../assets/icons/databases.svg';
import userSecret from '../../assets/icons/user-secret.svg';
import userChecked from '../../assets/icons/user-check.svg';
//@ts-ignore
import UserSettings from '../UserSettings/UserSettings';
import routes, {createHref, CLUSTER_PAGES} from '../../routes';

//@ts-ignore
import {logout, setIsNotAuthenticated} from '../../store/reducers/authentication';

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
    const iconDate = ydbUser?.login ? userChecked : userSecret;
    return (
        <AsideHeaderFooterItem
            isCurrent={isUserDropdownVisible}
            slot={SlotName.User}
            renderCustomIcon={() => <Icon data={iconDate} size={22} className={b('user-icon')} />}
            text={ydbUser?.login ?? 'Account'}
            isCompact={isCompact}
            popupAnchor={popupAnchor}
            popupVisible={isUserDropdownVisible}
            onClick={() => setIsUserDropdownVisible(true)}
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
    logout: VoidFunction;
    setIsNotAuthenticated: VoidFunction;
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

function AsideNavigation(props: AsideNavigationProps) {
    const location = useLocation();
    const history = useHistory();

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
                logoText="YDB"
                logoIcon={ydbLogoIcon}
                onLogoIconClick={() => history.push('/')}
                menuItems={menuItems}
                settings={<UserSettings />}
                initIsCompact
                className={b()}
                renderContent={() => props.children}
                renderFooter={({isCompact, asideRef}) => (
                    <React.Fragment>
                        <AsideHeaderFooterItem
                            slot={SlotName.Support}
                            iconSize={24}
                            text="Documentation"
                            isCompact={isCompact}
                            onClick={() => {
                                window.open('http://ydb.tech/docs', '_blank', 'noreferrer');
                            }}
                        />

                        <YdbUserDropdown
                            isCompact={isCompact}
                            popupAnchor={asideRef}
                            ydbUser={{
                                login: props.ydbUser,
                                logout: props.logout,
                                setIsNotAuthenticated: props.setIsNotAuthenticated,
                            }}
                        />
                    </React.Fragment>
                )}
            />
        </React.Fragment>
    );
}

const mapStateToProps = (state: any) => {
    const {user: ydbUser} = state.authentication;

    return {
        ydbUser,
    };
};

const mapDispatchToProps = {
    logout,
    setIsNotAuthenticated,
};

export default connect(mapStateToProps, mapDispatchToProps)(AsideNavigation);
