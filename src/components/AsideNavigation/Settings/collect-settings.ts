import React from 'react';
import {IconProps} from '@gravity-ui/uikit';
import {invariant} from './helpers';

type SettingsMenu = (SettingsMenuGroup | SettingsMenuItem)[];

interface SettingsMenuGroup {
    groupTitle: string;
    items: SettingsMenuItem[];
}

interface SettingsMenuItem {
    title: string;
    icon?: IconProps;
    pageId: string;
    withBadge?: boolean;
}

export interface SettingsPage {
    sections: SettingsPageSection[];
    hide?: boolean;
    withBadge?: boolean;
}

interface SettingsPageSection {
    title: string;
    header?: React.ReactNode;
    items: SettingsItem[];
    hide?: boolean;
    withBadge?: boolean;
}

interface SettingsItem {
    title: string;
    children: React.ReactNode;
    hide?: boolean;
    titleComponent?: React.ReactNode;
    renderTitleComponent?: (highlightedTitle: React.ReactNode | null) => React.ReactNode;
}

export function getSettingsFromChildren(
    children: React.ReactNode,
    basepath = '',
): {menu: SettingsMenu; pages: Record<string, SettingsPage>} {
    const menu: SettingsMenu = [];
    const pages: Record<string, SettingsPage> = {};
    let hasGroup = false;
    let hasItems = false;
    React.Children.forEach(children, (element) => {
        if (!React.isValidElement(element)) {
            // Ignore non-elements.
            return;
        }
        if (element.type === React.Fragment) {
            // Transparently support React.Fragment and its children.
            const {menu: menuFragment, pages: pagesFragment} = getSettingsFromChildren(
                element.props.children,
                basepath,
            );
            menu.push(...menuFragment);
            Object.assign(pages, pagesFragment);
        } else if (element.props.groupTitle) {
            if (process.env.NODE_ENV === 'development') {
                invariant(!hasItems, 'Setting menu must not mix groups and pages on one level');
            }

            const pageId = `${basepath}/${element.props.id ?? element.props.groupTitle}`;
            hasGroup = true;

            const {menu: menuFragment, pages: pagesFragment} = getSettingsFromChildren(
                element.props.children,
                pageId,
            );

            if (process.env.NODE_ENV === 'development') {
                const hasInnerGroup = menuFragment.some((item) => 'groupTitle' in item);
                invariant(
                    !hasInnerGroup,
                    `Group ${element.props.groupTitle} should not include groups`,
                );
            }

            menu.push({
                groupTitle: element.props.groupTitle,
                // @ts-ignore
                items: menuFragment,
            });
            Object.assign(pages, pagesFragment);
        } else {
            hasItems = true;
            const pageId = `${basepath}/${element.props.id ?? element.props.title}`;

            if (process.env.NODE_ENV === 'development') {
                invariant(Boolean(element.props.title), 'Component must include title prop');
                invariant(!hasGroup, 'Setting menu must not mix groups and pages on one level');
                invariant(!pages[pageId], `Setting menu page id must be uniq (${pageId})`);
            }

            pages[pageId] = getSettingsPageFromChildren(element.props.children);
            menu.push({
                pageId,
                title: element.props.title,
                icon: element.props.icon,
                withBadge: pages[pageId].withBadge,
            });
        }
    });
    return {menu, pages};
}

function getSettingsPageFromChildren(children: React.ReactNode): SettingsPage {
    const page: SettingsPage = {sections: []};
    React.Children.forEach(children, (element) => {
        if (!React.isValidElement(element)) {
            // Ignore non-elements.
            return;
        }
        if (element.type === React.Fragment) {
            // Transparently support React.Fragment and its children.
            const {sections, withBadge} = getSettingsPageFromChildren(element.props.children);
            page.sections.push(...sections);
            page.withBadge = withBadge || page.withBadge;
        } else {
            const {title, header} = element.props;
            page.withBadge = element.props.withBadge || page.withBadge;
            page.sections.push({
                title,
                header,
                withBadge: element.props.withBadge,
                items: getSettingsItemsFromChildren(element.props.children),
            });
        }
    });
    return page;
}

function getSettingsItemsFromChildren(children: React.ReactNode): SettingsItem[] {
    const items: SettingsItem[] = [];
    React.Children.forEach(children, (element) => {
        if (!React.isValidElement(element)) {
            // Ignore non-elements.
            return;
        }
        if (element.type === React.Fragment) {
            // Transparently support React.Fragment and its children.
            items.push(...getSettingsItemsFromChildren(element.props.children));
        } else {
            items.push({
                title: element.props.title,
                renderTitleComponent: element.props.renderTitleComponent,
                children: element,
            });
        }
    });
    return items;
}
