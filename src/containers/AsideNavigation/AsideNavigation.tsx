import React from 'react';

import {CircleQuestion, Gear, Keyboard, Person} from '@gravity-ui/icons';
import type {MenuItem} from '@gravity-ui/navigation';
import {AsideHeader, FooterItem, HotkeysPanel} from '@gravity-ui/navigation';
import {Hotkey, Icon} from '@gravity-ui/uikit';
import type {IconData} from '@gravity-ui/uikit';
import hotkeys from 'hotkeys-js';
import {useHistory} from 'react-router-dom';

import {cn} from '../../utils/cn';
import {ASIDE_HEADER_COMPACT_KEY} from '../../utils/constants';
import {useSetting} from '../../utils/hooks';

import {HelpCenterContent} from './HelpCenter';
import type {FooterItem as HelpCenterFooterItem} from './HelpCenter/types';
import {HOTKEYS, SHORTCUTS_HOTKEY} from './constants';
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
}

enum Panel {
    UserSettings = 'UserSettings',
    Documentation = 'Documentation',
    Hotkeys = 'Hotkeys',
}

// Footer items for the help menu
const FOOTER_ITEMS: HelpCenterFooterItem[] = [
    {
        id: 'shortCuts',
        text: 'Keyboard shortcuts',
        icon: <Icon data={Keyboard} />,
        rightContent: <Hotkey value={SHORTCUTS_HOTKEY} />,
    },
];

export function AsideNavigation(props: AsideNavigationProps) {
    const history = useHistory();

    const [visiblePanel, setVisiblePanel] = React.useState<Panel>();
    const [documentationPopupVisible, setDocumentationPopupVisible] = React.useState(false);
    const [compact, setIsCompact] = useSetting<boolean>(ASIDE_HEADER_COMPACT_KEY);

    const toggleDocumentationPopup = React.useCallback(
        () => setDocumentationPopupVisible(!documentationPopupVisible),
        [documentationPopupVisible],
    );

    const closeDocumentationPopup = React.useCallback(
        () => setDocumentationPopupVisible(false),
        [],
    );

    const openHotkeysPanel = React.useCallback(() => {
        closeDocumentationPopup();
        setVisiblePanel(Panel.Hotkeys);
    }, [closeDocumentationPopup]);

    const closePanel = React.useCallback(() => {
        setVisiblePanel(undefined);
    }, []);

    const renderHelpMenu = () => {
        // Create a modified copy of FOOTER_ITEMS with the shortCuts onClick handler properly set
        const footerItemsWithHandlers: HelpCenterFooterItem[] = FOOTER_ITEMS.map((item) => {
            if (item.id === 'shortCuts') {
                return {
                    ...item,
                    onClick: openHotkeysPanel,
                };
            }
            return item;
        });

        return <HelpCenterContent view="single" footerItems={footerItemsWithHandlers} />;
    };
    React.useEffect(() => {
        // Register hotkey for keyboard shortcuts
        hotkeys(SHORTCUTS_HOTKEY, (event) => {
            event.preventDefault();
            setVisiblePanel(Panel.Hotkeys);
        });

        // Add listener for custom event from Monaco editor
        const handleOpenKeyboardShortcutsPanel = () => {
            setVisiblePanel(Panel.Hotkeys);
        };

        window.addEventListener('openKeyboardShortcutsPanel', handleOpenKeyboardShortcutsPanel);

        return () => {
            hotkeys.unbind(SHORTCUTS_HOTKEY);
            window.removeEventListener(
                'openKeyboardShortcutsPanel',
                handleOpenKeyboardShortcutsPanel,
            );
        };
    }, []);

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
                                current: documentationPopupVisible,
                                onItemClick: toggleDocumentationPopup,
                            }}
                            enableTooltip={!documentationPopupVisible}
                            popupVisible={documentationPopupVisible}
                            onClosePopup={closeDocumentationPopup}
                            renderPopupContent={renderHelpMenu}
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
                    {
                        id: 'documentation',
                        visible: visiblePanel === Panel.Documentation,
                        content: renderHelpMenu(),
                    },
                    {
                        id: 'hotkeys',
                        visible: visiblePanel === Panel.Hotkeys,
                        content: (
                            <HotkeysPanel
                                visible={visiblePanel === Panel.Hotkeys}
                                hotkeys={HOTKEYS}
                                className={b('hotkeys-panel')}
                                title={
                                    <div className={b('hotkeys-panel-title')}>
                                        Keyboard Shortcuts
                                        <Hotkey value={SHORTCUTS_HOTKEY} />
                                    </div>
                                }
                                onClose={closePanel}
                            />
                        ),
                    },
                ]}
                onClosePanel={closePanel}
            />
        </React.Fragment>
    );
}
