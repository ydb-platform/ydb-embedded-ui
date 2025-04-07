import {Link, List, Text} from '@gravity-ui/uikit';

import {settingsManager} from '../../../services/settings';
import {cn} from '../../../utils/cn';
import {LANGUAGE_KEY} from '../../../utils/constants';

import {FooterItemComponent} from './FooterItemComponent';
import type {DisplayFooterItem, DocsItem, LimitedFooterItemsArray} from './types';

import './HelpCenter.scss';

const b = cn('help-center');

function renderLinkItem(item: DocsItem) {
    const {text, url} = item;
    const title = typeof text === 'string' ? text : undefined;

    return url ? (
        <Link className={b('docs-link')} rel="noopener" target="_blank" href={url} title={title}>
            {text}
        </Link>
    ) : (
        text
    );
}

function renderListItem(item: DisplayFooterItem) {
    return (
        <FooterItemComponent item={item}>
            <div className={b('item-icon-wrap')}>{item.icon}</div>
        </FooterItemComponent>
    );
}

function onFooterItemClick(item: DisplayFooterItem) {
    const {url, disableClickHandler = true, onClick} = item;
    if (url && disableClickHandler) {
        return;
    }
    if (typeof onClick === 'function') {
        onClick();
    }
}

function renderFooter(footerItems?: LimitedFooterItemsArray) {
    if (!footerItems?.length) {
        return null;
    }
    const customItems: DisplayFooterItem[] = footerItems.map((item, idx) => ({
        ...item,
        id: item.id + idx,
    }));

    return (
        <div className={b('footer')}>
            <div className={b('contact-list-wrap')}>
                <List
                    items={customItems}
                    onItemClick={onFooterItemClick}
                    filterable={false}
                    virtualized={false}
                    renderItem={renderListItem}
                    itemClassName={b('item')}
                />
            </div>
        </div>
    );
}

// Get documentation link based on language settings
function getDocumentationLink(): string {
    // Use saved language from settings if it's present, otherwise use browser language
    const lang = settingsManager.readUserSettingsValue(LANGUAGE_KEY, navigator.language);

    if (lang === 'ru') {
        return 'https://ydb.tech/docs/ru/';
    }

    return 'https://ydb.tech/docs/en/';
}

export interface HelpCenterContentProps {
    /** The view type of the help center */
    view?: 'single' | 'separated';
    /** Footer items for actions like keyboard shortcuts */
    footerItems?: LimitedFooterItemsArray;
    /** Class for the HelpCenterContent component itself */
    className?: string;
}

export function HelpCenterContent({
    view = 'single',
    footerItems,
    className,
}: HelpCenterContentProps) {
    return (
        <div className={b('content', {}, className)}>
            <div className={b('docs')}>
                <Text variant="subheader-3" color="primary" className={b('title')}>
                    Documentation
                </Text>
                <div className={b('docs-list-wrap')}>
                    <List
                        items={[
                            {
                                text: 'YDB Documentation',
                                url: getDocumentationLink(),
                            },
                        ]}
                        filterable={false}
                        virtualized={false}
                        renderItem={renderLinkItem}
                        itemClassName={b('item')}
                    />
                </div>
            </div>
            {view === 'single' && renderFooter(footerItems)}
        </div>
    );
}
