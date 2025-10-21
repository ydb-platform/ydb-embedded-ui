import React from 'react';

import {CircleQuestion, Gear, Person} from '@gravity-ui/icons';
import type {MenuItem} from '@gravity-ui/navigation';
import {AsideHeader, FooterItem} from '@gravity-ui/navigation';
import type {IconData} from '@gravity-ui/uikit';
import {useHistory} from 'react-router-dom';

import {cn} from '../../utils/cn';
import {ASIDE_HEADER_COMPACT_KEY} from '../../utils/constants';
import {useSetting} from '../../utils/hooks';

import {InformationPopup} from './InformationPopup';
import {useHotkeysPanel} from './hooks/useHotkeysPanel';
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
    const iconData = user ? (user.icon ?? Person) : userSecret;
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
    renderFooterItems?: (defaultFooterItems: React.ReactNode) => React.ReactNode;
}

enum Panel {
    UserSettings = 'UserSettings',
    Information = 'Information',
    Hotkeys = 'Hotkeys',
}

export function AsideNavigation(props: AsideNavigationProps) {
    const history = useHistory();

    const [visiblePanel, setVisiblePanel] = React.useState<Panel>();
    const [informationPopupVisible, setInformationPopupVisible] = React.useState(false);
    const [compact, setIsCompact] = useSetting<boolean>(ASIDE_HEADER_COMPACT_KEY);

    const toggleInformationPopup = () => setInformationPopupVisible((prev) => !prev);

    const closeInformationPopup = React.useCallback(() => setInformationPopupVisible(false), []);

    const openHotkeysPanel = React.useCallback(() => {
        closeInformationPopup();
        setVisiblePanel(Panel.Hotkeys);
    }, [closeInformationPopup]);

    const closePanel = React.useCallback(() => {
        setVisiblePanel(undefined);
    }, []);

    const {renderPanel: renderHotkeysPanel} = useHotkeysPanel({
        isPanelVisible: visiblePanel === Panel.Hotkeys,
        closePanel,
        openPanel: openHotkeysPanel,
    });

    const renderInformationPopup = () => {
        return <InformationPopup onKeyboardShortcutsClick={openHotkeysPanel} />;
    };

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
                renderFooter={({compact: footerCompact, asideRef}) => {
                    const defaultFooterItems = [
                        <FooterItem
                            key="information"
                            compact={footerCompact}
                            item={{
                                id: 'information',
                                title: i18n('navigation-item.information'),
                                icon: CircleQuestion,
                                current: informationPopupVisible,
                                onItemClick: toggleInformationPopup,
                            }}
                            enableTooltip={!informationPopupVisible}
                            popupVisible={informationPopupVisible}
                            onClosePopup={closeInformationPopup}
                            renderPopupContent={renderInformationPopup}
                        />,

                        <FooterItem
                            key="user-settings"
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
                            compact={footerCompact}
                        />,

                        <UserDropdown
                            key="user-dropdown"
                            isCompact={footerCompact}
                            popupAnchor={asideRef}
                            user={props.user}
                        >
                            {props.ydbInternalUser}
                        </UserDropdown>,
                    ];

                    return (
                        <React.Fragment>
                            {props.renderFooterItems
                                ? props.renderFooterItems(defaultFooterItems)
                                : defaultFooterItems}
                        </React.Fragment>
                    );
                }}
                panelItems={[
                    {
                        id: 'user-settings',
                        visible: visiblePanel === Panel.UserSettings,
                        content: props.settings,
                    },
                    {
                        id: 'information',
                        visible: visiblePanel === Panel.Information,
                    },
                    {
                        id: 'hotkeys',
                        visible: visiblePanel === Panel.Hotkeys,
                        keepMounted: true,
                        content: renderHotkeysPanel(),
                    },
                ]}
                onClosePanel={closePanel}
            />
        </React.Fragment>
    );
}
