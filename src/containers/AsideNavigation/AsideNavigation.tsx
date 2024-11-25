import React from 'react';

import {CircleQuestion, Gear, Person} from '@gravity-ui/icons';
import type {MenuItem} from '@gravity-ui/navigation';
import {AsideHeader, FooterItem} from '@gravity-ui/navigation';
import type {IconData} from '@gravity-ui/uikit';
import {useHistory} from 'react-router-dom';

import {settingsManager} from '../../services/settings';
import {cn} from '../../utils/cn';
import {ASIDE_HEADER_COMPACT_KEY, LANGUAGE_KEY} from '../../utils/constants';
import {useSetting} from '../../utils/hooks';

import i18n from './i18n';

import userSecret from '../../assets/icons/user-secret.svg';
import ydbLogoIcon from '../../assets/icons/ydb.svg';

import './AsideNavigation.scss';

const b = cn('kv-navigation');

interface YdbUserDropdownProps {
    isCompact: boolean;
    user?: {
        login: string;
        icon?: IconData;
    };
    popupAnchor: React.RefObject<HTMLDivElement>;
    children: React.ReactNode;
}

function UserDropdown({isCompact, popupAnchor, user, children}: YdbUserDropdownProps) {
    const [isUserDropdownVisible, setIsUserDropdownVisible] = React.useState(false);
    const iconData = user ? user.icon ?? Person : userSecret;
    return (
        <FooterItem
            compact={isCompact}
            item={{
                id: 'user-popup',
                title: user?.login ? user.login : i18n('navigation-item.account'),
                current: isUserDropdownVisible,
                icon: iconData,
                onItemClick: () => setIsUserDropdownVisible((v) => !v),
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
    user?: {login: string; icon?: IconData};
}

enum Panel {
    UserSettings = 'UserSettings',
}

function getDocumentationLink() {
    // Use saved language from settings if it's present, otherwise use browser language
    const lang = settingsManager.readUserSettingsValue(LANGUAGE_KEY, navigator.language);

    if (lang === 'ru') {
        return 'https://ydb.tech/docs/ru/';
    }

    return 'https://ydb.tech/docs/en/';
}

export function AsideNavigation(props: AsideNavigationProps) {
    const history = useHistory();

    const [visiblePanel, setVisiblePanel] = React.useState<Panel>();

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
                                icon: CircleQuestion,
                                onItemClick: () => {
                                    window.open(getDocumentationLink(), '_blank', 'noreferrer');
                                },
                            }}
                        />

                        <FooterItem
                            item={{
                                id: 'user-settings',
                                title: i18n('navigation-item.settings'),
                                icon: Gear,
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

                        <UserDropdown isCompact={compact} popupAnchor={asideRef} user={props.user}>
                            {props.ydbInternalUser}
                        </UserDropdown>
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
