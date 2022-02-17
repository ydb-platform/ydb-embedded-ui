import React from 'react';
import block from 'bem-cn-lite';
import i18n from './i18n';

import {IconProps, Loader} from '@yandex-cloud/uikit';
import {SettingsSearch} from './SettingsSearch/SettingsSearch';
import {SettingsMenu, SettingsMenuItems, SettingsMenuInstance} from './SettingsMenu/SettingsMenu';

import {getSettingsFromChildren} from './collect-settings';
import {filterSettings} from './filter-settings';
import {escapeStringForRegExp} from './helpers';

import './Settings.scss';

const b = block('nv-settings');

interface SettingsProps {
    initialPage?: string;
    onPageChange?: (page: string | undefined) => void;
    children: React.ReactNode;
    renderNotFound?: () => React.ReactNode;
    renderLoading?: () => React.ReactNode;
    loading?: boolean;
}

interface SettingsGroupProps {
    id?: string;
    groupTitle: string;
    children: React.ReactNode;
}

interface SettingsPageProps {
    id?: string;
    title: string;
    icon: IconProps;
    children: React.ReactNode;
}

interface SettingsSectionProps {
    title: string;
    header?: React.ReactNode;
    children: React.ReactNode;
    withBadge?: boolean;
}

interface SettingsItemProps {
    title: string;
    renderTitleComponent?: (highlightedTitle: React.ReactNode | null) => React.ReactNode;
    align?: 'top' | 'center';
    children: React.ReactNode;
    withBadge?: boolean;
}

const ItemContext = React.createContext<React.ReactNode>(undefined);

export function Settings({
    initialPage,
    onPageChange,
    children,
    renderNotFound,
    loading,
    renderLoading,
}: SettingsProps) {
    const [search, setSearch] = React.useState('');
    const [selectedPage, setCurrentPage] = React.useState<string | undefined>(initialPage);
    const prevSelectedPageRef = React.useRef(initialPage);
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const menuRef = React.useRef<SettingsMenuInstance>(null);

    React.useEffect(() => {
        menuRef.current?.clearFocus();
    }, [search]);

    React.useEffect(() => {
        const handler = () => {
            menuRef.current?.clearFocus();
        };
        window.addEventListener('click', handler);
        return () => {
            window.removeEventListener('click', handler);
        };
    }, []);

    if (selectedPage !== prevSelectedPageRef.current) {
        onPageChange?.(selectedPage);
        prevSelectedPageRef.current = selectedPage;
    }

    if (loading) {
        return (
            <div className={b({loading: true})}>
                {typeof renderLoading === 'function' ? (
                    renderLoading()
                ) : (
                    <Loader className={b('loader')} size="m" />
                )}
            </div>
        );
    }

    const {menu, pages} = getSettingsFromChildren(children);
    filterSettings(pages, search, prepareTitle);

    const settingsMenu: SettingsMenuItems = [];
    for (const fistLevel of menu) {
        if ('groupTitle' in fistLevel) {
            settingsMenu.push({
                groupTitle: fistLevel.groupTitle,
                items: fistLevel.items.map((item) => ({
                    id: item.pageId,
                    title: item.title,
                    icon: item.icon,
                    disabled: pages[item.pageId].hide,
                    withBadge: item.withBadge,
                })),
            });
        } else {
            settingsMenu.push({
                id: fistLevel.pageId,
                title: fistLevel.title,
                icon: fistLevel.icon,
                disabled: pages[fistLevel.pageId].hide,
                withBadge: fistLevel.withBadge,
            });
        }
    }

    let activePage = selectedPage;
    if (!activePage || pages[activePage]?.hide) {
        activePage = undefined;
        for (const firstLevel of settingsMenu) {
            if ('groupTitle' in firstLevel) {
                for (const item of firstLevel.items) {
                    if (!item.disabled) {
                        activePage = item.id;
                        break;
                    }
                }
                if (activePage) {
                    break;
                }
            } else if (!firstLevel.disabled) {
                activePage = firstLevel.id;
                break;
            }
        }
    }

    if (activePage !== selectedPage) {
        setCurrentPage(activePage);
    }

    return (
        <div className={b()}>
            <div
                className={b('menu')}
                onClick={() => {
                    if (searchInputRef.current) {
                        searchInputRef.current.focus();
                    }
                }}
                onKeyDown={(event) => {
                    if (menuRef.current) {
                        if (menuRef.current.handleKeyDown(event)) {
                            event.preventDefault();
                        }
                    }
                }}
            >
                <h2 className={b('heading')}>{i18n('heading_settings')}</h2>
                <SettingsSearch
                    inputRef={searchInputRef}
                    className={b('search')}
                    onChange={setSearch}
                />
                <SettingsMenu
                    ref={menuRef}
                    items={settingsMenu}
                    onChange={setCurrentPage}
                    activeItem={activePage}
                />
            </div>
            <div className={b('page')}>
                {activePage ? (
                    pages[activePage].sections.map((section) => {
                        if (section.hide) {
                            return null;
                        }
                        return (
                            <div key={section.title} className={b('section')}>
                                <h3 className={b('section-heading', {badge: section.withBadge})}>
                                    {section.title}
                                </h3>
                                {section.header ? section.header : null}
                                {section.items.map(({hide, title, children, titleComponent}) =>
                                    hide ? null : (
                                        <div key={title} className={b('section-item')}>
                                            <ItemContext.Provider value={titleComponent}>
                                                {children}
                                            </ItemContext.Provider>
                                        </div>
                                    ),
                                )}
                            </div>
                        );
                    })
                ) : typeof renderNotFound === 'function' ? (
                    renderNotFound()
                ) : (
                    <div className={b('not-found')}>{i18n('not-found')}</div>
                )}
            </div>
        </div>
    );
}

Settings.Group = function SettingsGroup({children}: SettingsGroupProps) {
    return <React.Fragment>{children}</React.Fragment>;
};

Settings.Page = function SettingsPage({children}: SettingsPageProps) {
    return <React.Fragment>{children}</React.Fragment>;
};

Settings.Section = function SettingsSection({children}: SettingsSectionProps) {
    return <React.Fragment>{children}</React.Fragment>;
};

Settings.Item = function SettingsItem({
    title,
    children,
    align = 'center',
    withBadge,
}: SettingsItemProps) {
    const contextTitle = React.useContext(ItemContext);
    return (
        <div className={b('item', {align})}>
            <label className={b('item-heading', {badge: withBadge})}>{contextTitle ?? title}</label>
            <div>{children}</div>
        </div>
    );
};

function prepareTitle(string: string, search: string) {
    let temp = string.slice(0);
    const title: React.ReactNode[] = [];
    const parts = escapeStringForRegExp(search).split(' ').filter(Boolean);
    let key = 0;
    for (const part of parts) {
        const regex = new RegExp(part, 'ig');
        const match = regex.exec(temp);
        if (match) {
            const m = match[0];
            const i = match.index;
            if (i > 0) {
                title.push(temp.slice(0, i));
            }
            title.push(
                <strong key={key++} className={b('found')}>
                    {m}
                </strong>,
            );
            temp = temp.slice(i + m.length);
        }
    }
    if (temp) {
        title.push(temp);
    }
    return title;
}
