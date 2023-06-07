import React, {useState} from 'react';
import {connect} from 'react-redux';
import {useLocation} from 'react-router';
import {useHistory} from 'react-router-dom';
import cn from 'bem-cn-lite';

import {Icon, Button} from '@gravity-ui/uikit';
import {AsideHeader, MenuItem as AsideHeaderMenuItem, FooterItem} from '@gravity-ui/navigation';

import signOutIcon from '../../assets/icons/signOut.svg';
import signInIcon from '../../assets/icons/signIn.svg';
import ydbLogoIcon from '../../assets/icons/ydb.svg';
import userSecret from '../../assets/icons/user-secret.svg';
import userChecked from '../../assets/icons/user-check.svg';
import settingsIcon from '../../assets/icons/settings.svg';
import supportIcon from '../../assets/icons/support.svg';

import {UserSettings} from '../UserSettings/UserSettings';

import routes, {createHref} from '../../routes';

import {logout} from '../../store/reducers/authentication';
import {getParsedSettingValue, setSettingValue} from '../../store/reducers/settings/settings';

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
}

function YbdInternalUser({ydbUser, logout}: YbdInternalUserProps) {
    const history = useHistory();

    const handleLoginClick = () => {
        history.push(createHref(routes.auth, undefined, {returnUrl: encodeURI(location.href)}));
    };

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
                <Button view="flat-secondary" title="login" onClick={handleLoginClick}>
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
                    <YbdInternalUser ydbUser={ydbUser.login} logout={ydbUser.logout} />
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
    setSettingValue: (name: string, value: string) => void;
}

// FIXME: add items or delete
const items: MenuItem[] = [];

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

    const menuItems: AsideHeaderMenuItem[] = React.useMemo(() => {
        const {pathname} = location;
        const menuItems: AsideHeaderMenuItem[] = items.map((item) => {
            const locationKeysCoincidence = item.locationKeys?.filter((key) =>
                pathname.startsWith(key),
            );
            const current =
                (locationKeysCoincidence && locationKeysCoincidence.length > 0) ||
                item.location.startsWith(pathname);
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
        compact: getParsedSettingValue(state, ASIDE_HEADER_COMPACT_KEY),
    };
};

const mapDispatchToProps = {
    logout,
    setSettingValue,
};

export default connect(mapStateToProps, mapDispatchToProps)(AsideNavigation);
