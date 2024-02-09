import React, {useState} from 'react';
import {useHistory} from 'react-router-dom';
import cn from 'bem-cn-lite';

import {AsideHeader, FooterItem, MenuItem} from '@gravity-ui/navigation';

import ydbLogoIcon from '../../assets/icons/ydb.svg';
import userSecret from '../../assets/icons/user-secret.svg';
import userChecked from '../../assets/icons/user-check.svg';
import settingsIcon from '../../assets/icons/settings.svg';
import supportIcon from '../../assets/icons/support.svg';

import {useSetting, useTypedSelector} from '../../utils/hooks';
import {ASIDE_HEADER_COMPACT_KEY} from '../../utils/constants';

import i18n from './i18n';
import './AsideNavigation.scss';

const b = cn('kv-navigation');

interface YdbUserDropdownProps {
    isCompact: boolean;
    ydbUser: {
        login?: string;
    };
    popupAnchor: React.RefObject<HTMLDivElement>;
    children: React.ReactNode;
}

function YdbUserDropdown({isCompact, popupAnchor, ydbUser, children}: YdbUserDropdownProps) {
    const [isUserDropdownVisible, setIsUserDropdownVisible] = useState(false);
    const iconData = ydbUser.login ? userChecked : userSecret;
    return (
        <FooterItem
            compact={isCompact}
            item={{
                id: 'user-popup',
                title: ydbUser.login ? ydbUser.login : i18n('navigation-item.account'),
                current: isUserDropdownVisible,
                icon: iconData,
                iconSize: 22,
                onItemClick: () => setIsUserDropdownVisible(true),
            }}
            enableTooltip={!isUserDropdownVisible}
            popupAnchor={popupAnchor}
            popupVisible={isUserDropdownVisible}
            onClosePopup={() => setIsUserDropdownVisible(false)}
            renderPopupContent={() => <div className={b('ydb-user-wrapper')}>{children}</div>}
        />
    );
}

export interface AsideNavigationProps {
    settings: JSX.Element;
    ydbInternalUser: JSX.Element;
    menuItems?: MenuItem[];
    content: React.ReactNode;
}

enum Panel {
    UserSettings = 'UserSettings',
}

export function AsideNavigation(props: AsideNavigationProps) {
    const history = useHistory();

    const [visiblePanel, setVisiblePanel] = useState<Panel>();

    const {user: ydbUser} = useTypedSelector((state) => state.authentication);
    const [compact, setIsCompact] = useSetting<boolean>(ASIDE_HEADER_COMPACT_KEY);

    return (
        <React.Fragment>
            <AsideHeader
                logo={{
                    text: 'YDB',
                    icon: ydbLogoIcon,
                    onClick: () => history.push('/'),
                }}
                menuItems={props.menuItems}
                compact={compact}
                onChangeCompact={setIsCompact}
                className={b()}
                renderContent={() => props.content}
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
                            }}
                        >
                            {props.ydbInternalUser}
                        </YdbUserDropdown>
                    </React.Fragment>
                )}
                panelItems={[
                    {
                        id: 'user-settings',
                        visible: visiblePanel === Panel.UserSettings,
                        content: props.settings,
                    },
                ]}
                onClosePanel={() => {
                    setVisiblePanel(undefined);
                }}
            />
        </React.Fragment>
    );
}
