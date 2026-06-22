import React from 'react';

import {CircleQuestion, Gear, Person} from '@gravity-ui/icons';
import type {AsideHeaderItem} from '@gravity-ui/navigation';
import {AsideHeader, FooterItem} from '@gravity-ui/navigation';
import type {IconData} from '@gravity-ui/uikit';
import {useHistory} from 'react-router-dom';

import {useMultiTabQueryEditorEnabled} from '../../store/reducers/capabilities/hooks';
import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {cn} from '../../utils/cn';
import {useSetting} from '../../utils/hooks';

import {InformationPopup} from './InformationPopup';
import {
    DEFAULT_HOTKEY_GROUPS,
    EDITOR_TABS_HOTKEY_GROUP,
    useHotkeysPanel,
} from './hooks/useHotkeysPanel';
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
            id="user-popup"
            title={user?.login ? user.login : i18n('navigation-item.account')}
            current={isUserDropdownVisible}
            icon={iconData}
            qa="aside-user"
            onItemClick={() => setIsUserDropdownVisible((v) => !v)}
            enableTooltip={!isUserDropdownVisible}
            popupRef={popupAnchor}
            popupVisible={isUserDropdownVisible}
            onOpenChangePopup={(open) => {
                if (!open) {
                    setIsUserDropdownVisible(false);
                }
            }}
            renderPopupContent={() => (
                <div className={b('ydb-user-wrapper')} data-qa="aside-user-popup">
                    {children}
                </div>
            )}
        />
    );
}

export interface AsideNavigationProps {
    settings: JSX.Element;
    ydbInternalUser: JSX.Element;
    menuItems?: AsideHeaderItem[];
    content: React.ReactNode;
    user?: {login: string; icon?: IconData};
    renderFooterItems?: (
        defaultFooterItems: React.ReactNode[],
        ctx: {compact: boolean; asideRef: React.RefObject<HTMLDivElement>},
    ) => React.ReactNode[];
    className?: string;
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
    const [compact, setIsCompact] = useSetting<boolean>(SETTING_KEYS.ASIDE_HEADER_COMPACT);

    const toggleInformationPopup = () => setInformationPopupVisible((prev) => !prev);

    const closeInformationPopup = React.useCallback(() => setInformationPopupVisible(false), []);

    const openHotkeysPanel = React.useCallback(() => {
        closeInformationPopup();
        setVisiblePanel(Panel.Hotkeys);
    }, [closeInformationPopup]);

    const closePanel = React.useCallback(() => {
        setVisiblePanel(undefined);
    }, []);

    const isMultiTabQueryEditorEnabled = useMultiTabQueryEditorEnabled();

    const hotkeyGroups = isMultiTabQueryEditorEnabled
        ? [...DEFAULT_HOTKEY_GROUPS, EDITOR_TABS_HOTKEY_GROUP]
        : DEFAULT_HOTKEY_GROUPS;

    const {renderPanel: renderHotkeysPanel} = useHotkeysPanel({
        isPanelVisible: visiblePanel === Panel.Hotkeys,
        closePanel,
        openPanel: openHotkeysPanel,
        hotkeyGroups,
    });

    const renderInformationPopup = () => {
        return <InformationPopup onKeyboardShortcutsClick={openHotkeysPanel} />;
    };

    const renderContent = React.useCallback(() => {
        return <div className={b('content')}>{props.content}</div>;
    }, [props.content]);

    const renderLogo = React.useCallback((node: React.ReactNode) => {
        if (!React.isValidElement(node)) {
            return node;
        }

        return React.cloneElement(node as React.ReactElement<{'data-qa'?: string}>, {
            'data-qa': 'aside-logo',
        });
    }, []);

    return (
        <React.Fragment>
            <AsideHeader
                qa="aside-navigation"
                logo={{
                    text: 'YDB',
                    icon: ydbLogoIcon,
                    onClick: () => history.push('/'),
                    wrapper: renderLogo,
                }}
                menuItems={props.menuItems}
                compact={compact}
                onChangeCompact={setIsCompact}
                multipleTooltip={true}
                className={b(null, props.className)}
                renderContent={renderContent}
                renderFooter={({compact: footerCompact, asideRef}) => {
                    const defaultFooterItems = [
                        <FooterItem
                            key="information"
                            compact={footerCompact}
                            id="information"
                            title={i18n('navigation-item.information')}
                            icon={CircleQuestion}
                            current={informationPopupVisible}
                            qa="aside-information"
                            onItemClick={toggleInformationPopup}
                            enableTooltip={!informationPopupVisible}
                            popupVisible={informationPopupVisible}
                            onOpenChangePopup={(open) => {
                                if (!open) {
                                    closeInformationPopup();
                                }
                            }}
                            renderPopupContent={renderInformationPopup}
                        />,

                        <FooterItem
                            key="user-settings"
                            id="user-settings"
                            title={i18n('navigation-item.settings')}
                            icon={Gear}
                            current={visiblePanel === Panel.UserSettings}
                            qa="aside-settings"
                            onItemClick={() => {
                                setVisiblePanel(
                                    visiblePanel === Panel.UserSettings
                                        ? undefined
                                        : Panel.UserSettings,
                                );
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
                                ? props.renderFooterItems(defaultFooterItems, {
                                      compact: footerCompact,
                                      asideRef,
                                  })
                                : defaultFooterItems}
                        </React.Fragment>
                    );
                }}
                panelItems={[
                    {
                        id: 'user-settings',
                        open: visiblePanel === Panel.UserSettings,
                        size: 'auto',
                        children: props.settings,
                    },
                    {
                        id: 'information',
                        open: visiblePanel === Panel.Information,
                    },
                    {
                        id: 'hotkeys',
                        open: visiblePanel === Panel.Hotkeys,
                        keepMounted: true,
                        children: renderHotkeysPanel(),
                    },
                ]}
                onClosePanel={closePanel}
            />
        </React.Fragment>
    );
}
