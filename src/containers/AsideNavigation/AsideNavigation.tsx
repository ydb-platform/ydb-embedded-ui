import React from 'react';

import {CircleQuestion, Gear, Person} from '@gravity-ui/icons';
import type {MenuItem} from '@gravity-ui/navigation';
import {AsideHeader, FooterItem, HotkeysPanel} from '@gravity-ui/navigation';
import {Hotkey} from '@gravity-ui/uikit';
import type {IconData} from '@gravity-ui/uikit';
import hotkeys from 'hotkeys-js';
import {useHistory} from 'react-router-dom';

import {cn} from '../../utils/cn';
import {ASIDE_HEADER_COMPACT_KEY} from '../../utils/constants';
import {useSetting} from '../../utils/hooks';

import {InformationPopup} from './InformationPopup';
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
    Information = 'Information',
    Hotkeys = 'Hotkeys',
}

/**
 * HotkeysPanelWrapper creates a render cycle separation between mounting and visibility change.
 * This is necessary for smooth animations as HotkeysPanel uses CSSTransition internally.
 *
 * When a component is both mounted and set to visible at once, CSSTransition can't
 * properly sequence its transition classes (panel → panel-active) because it's already active when mounted
 * and counts transition as it has already happened.
 * This wrapper ensures the component mounts first, then sets visible=true in a subsequent render cycle
 * to make transition actually happen.
 */
function HotkeysPanelWrapper({
    visiblePanel,
    closePanel,
}: {
    visiblePanel?: Panel;
    closePanel: () => void;
}) {
    const [visible, setVisible] = React.useState(false);

    React.useEffect(() => {
        setVisible(visiblePanel === Panel.Hotkeys);
    }, [visiblePanel]);

    return (
        <HotkeysPanel
            visible={visible}
            hotkeys={HOTKEYS}
            className={b('hotkeys-panel')}
            title={
                <div className={b('hotkeys-panel-title')}>
                    {i18n('help-center.footer.shortcuts')}
                    <Hotkey value={SHORTCUTS_HOTKEY} />
                </div>
            }
            onClose={closePanel}
        />
    );
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

    const renderInformationPopup = () => {
        return <InformationPopup onKeyboardShortcutsClick={openHotkeysPanel} />;
    };

    React.useEffect(() => {
        // Register hotkey for keyboard shortcuts
        hotkeys(SHORTCUTS_HOTKEY, openHotkeysPanel);

        // Add listener for custom event from Monaco editor
        window.addEventListener('openKeyboardShortcutsPanel', openHotkeysPanel);

        return () => {
            hotkeys.unbind(SHORTCUTS_HOTKEY);
            window.removeEventListener('openKeyboardShortcutsPanel', openHotkeysPanel);
        };
    }, [openHotkeysPanel]);

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
                        id: 'information',
                        visible: visiblePanel === Panel.Information,
                    },
                    {
                        id: 'hotkeys',
                        visible: visiblePanel === Panel.Hotkeys,
                        keepMounted: true,
                        content: (
                            <HotkeysPanelWrapper
                                visiblePanel={visiblePanel}
                                closePanel={closePanel}
                            />
                        ),
                    },
                ]}
                onClosePanel={closePanel}
            />
        </React.Fragment>
    );
}
