import React from 'react';

import {Icon, Link, List, Text} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import {FooterItemComponent} from './FooterItemComponent';
import {
    getFeatureLink,
    getProposalContactItem,
    getReportContactItem,
    getSupportContactItem,
    getSupportLink,
} from './helpers';
import type {
    ContactItem,
    CustomDisplayFooterItem,
    DisplayFooterItem,
    DocsCategory,
    DocsDividerItem,
    DocsItem,
    DocsItems,
    Environment,
    FooterItem,
    LimitedFooterItemsArray,
    ReservedDisplayFooterItem,
    ReservedFooterID,
    ReservedFooterItem,
    TitleItem,
} from './types';

import './HelpCenter.scss';

// You would need to import actual icon here if available
// import chevronRightRoundedIcon from '../../assets/icons/chevron-right-rounded.svg';
// Using a placeholder for now
const chevronRightRoundedIcon = 'chevron-right-rounded';

const b = cn('help-center');

interface HelpCenterContentGeneralProps {
    titleItem?: TitleItem;
    docsItems: DocsItems[] | DocsCategory[];
    /** Class for each displayed docsItems element */
    docsItemClassName?: string;
    /**
     * @deprecated use onFooterItemClick
     */
    onContactItemClick?: (item: ContactItem) => void;
    onFooterItemClick?: (item: DisplayFooterItem) => void;
    withReport?: boolean;
    featureLink?: false | string;
    supportLink?: false | string;
    /**
     * @deprecated use footerItems
     */
    contactItems?: ContactItem[];
    /**
     * @typedDef the array of footer items should have length <= 8
     */
    footerItems?: LimitedFooterItemsArray;
    extraFooterItems?: FooterItem[];
    /** Class for each displayed footerItems element */
    footerItemClassName?: string;
    footerTitleItem?: React.ReactNode;
    /** Class for the HelpCenterContent component itself */
    className?: string;
}

interface HelpCenterContentDefaultProps {
    installationType: 'external' | 'internal';
    view: 'single' | 'separated';
    hideDocumentationTitle: boolean;
    env: Environment;
}

export interface HelpCenterContentProps
    extends HelpCenterContentGeneralProps,
        Partial<HelpCenterContentDefaultProps> {}

type HelpCenterContentInnerProps = HelpCenterContentGeneralProps & HelpCenterContentDefaultProps;

const reservedIdIconsMap: Record<ReservedFooterID, string> = {
    aboutService: 'circle-exclamation',
    supportChat: 'comments',
    telegram: 'logo-telegram',
    atushkaClub: 'pencil-to-square',
    onboarding: 'gear-play',
    studyCourse: 'graduation-cap',
    shortCuts: 'keyboard',
    stackoverflow: 'code',
    tracker: 'logo-yandex-tracker',
    partnerSearch: 'suitcase',
    freelancersHelp: 'persons',
    createRequest: 'life-ring',
    wikiFAQ: 'file-text',
    swagger: 'curly-brackets',
};

const reservedIds: ReservedFooterID[] = [
    'aboutService',
    'supportChat',
    'telegram',
    'atushkaClub',
    'onboarding',
    'studyCourse',
    'shortCuts',
    'stackoverflow',
    'tracker',
    'partnerSearch',
    'freelancersHelp',
    'createRequest',
    'wikiFAQ',
    'swagger',
];

export class HelpCenterContent extends React.Component<HelpCenterContentInnerProps> {
    static defaultProps: HelpCenterContentDefaultProps = {
        installationType: 'external',
        view: 'single',
        hideDocumentationTitle: false,
        env: 'production',
    };

    render() {
        const {docsItems} = this.props;
        const hasCategories =
            typeof docsItems?.[0] === 'object' &&
            Object.prototype.hasOwnProperty.call(docsItems[0], 'title') &&
            Object.prototype.hasOwnProperty.call(docsItems[0], 'items');

        return hasCategories
            ? this.renderWithCategories(docsItems as DocsCategory[])
            : this.renderWithoutCategories(docsItems as DocsItems[]);
    }

    private renderWithCategories(docsItems: DocsCategory[]) {
        const {view, className} = this.props;
        return (
            <div className={b('content', {}, className)}>
                <div className={b('docs')}>
                    {this.renderTitle()}
                    {docsItems.map(({title, items}, index) => (
                        <React.Fragment key={index}>
                            <div className={b('docs-category-title')}>{title}</div>
                            {this.renderSingleCategory(items)}
                        </React.Fragment>
                    ))}
                </div>
                {view === 'single' && (
                    <React.Fragment>
                        {this.renderFooter()}
                        {this.renderExtraFooter()}
                    </React.Fragment>
                )}
            </div>
        );
    }

    private renderWithoutCategories(docsItems: DocsItems[]) {
        const {view, className} = this.props;
        return (
            <div className={b('content', {}, className)}>
                <div className={b('docs')}>
                    {this.renderTitle()}
                    {this.renderSingleCategory(docsItems)}
                </div>
                {view === 'single' && (
                    <React.Fragment>
                        {this.renderFooter()}
                        {this.renderExtraFooter()}
                    </React.Fragment>
                )}
            </div>
        );
    }

    private renderTitle() {
        const {hideDocumentationTitle, titleItem} = this.props;
        if (hideDocumentationTitle) {
            return null;
        }
        const {itemWrapper, url} = titleItem || {};
        const text = 'Documentation';
        if (typeof itemWrapper === 'function') {
            return itemWrapper(titleItem as TitleItem, text);
        }
        return (
            <Text variant="subheader-3" color="primary" className={b('title')}>
                {url ? (
                    <Link view="primary" target="_blank" href={url} className={b('title-link')}>
                        {text}
                        &nbsp;
                        <Icon data={chevronRightRoundedIcon} size={16} />
                    </Link>
                ) : (
                    text
                )}
            </Text>
        );
    }

    private isReservedItem(item: FooterItem): item is ReservedFooterItem {
        return (
            item.id !== 'custom' && reservedIdIconsMap[item.id as ReservedFooterID] !== undefined
        );
    }

    private renderFooter() {
        const {footerTitleItem, extraFooterItems} = this.props;
        let items = this.getFooterItems();
        const hasIcons =
            items?.some(
                (item) =>
                    ('reservedId' in item && item.reservedId) || ('icon' in item && item.icon),
            ) ?? false;
        let renderItem = this.getRenderFooterItem(hasIcons);

        if (items === null) {
            items = this.getDefaultFooterItem();
            renderItem = this.renderDefaultItem.bind(this);
        }

        if (items?.length === 0) {
            return null;
        }

        const withExtraFooter = extraFooterItems && extraFooterItems.length > 0;

        return (
            <div className={b('footer', {withExtraFooter})}>
                {footerTitleItem}
                <div className={b('contact-list-wrap')}>
                    <List
                        items={items}
                        onItemClick={this.onFooterItemClick}
                        filterable={false}
                        virtualized={false}
                        renderItem={renderItem}
                        itemClassName={b('item')}
                    />
                </div>
            </div>
        );
    }

    private renderExtraFooter() {
        const {extraFooterItems} = this.props;

        if (!extraFooterItems?.length) {
            return null;
        }

        const hasIcons =
            extraFooterItems?.some(
                (item) =>
                    ('reservedId' in item && item.reservedId) || ('icon' in item && item.icon),
            ) ?? false;
        const renderItem = this.getRenderFooterItem(hasIcons);

        return (
            <div className={b('extra-footer-wrap')}>
                <List
                    items={extraFooterItems as any}
                    onItemClick={this.onFooterItemClick}
                    filterable={false}
                    virtualized={false}
                    renderItem={renderItem}
                    itemClassName={b('item')}
                />
            </div>
        );
    }

    private getFooterItems(): DisplayFooterItem[] | null {
        const {footerItems, contactItems} = this.props;

        // Use deprecated contactItems if footerItems is not provided
        if (Array.isArray(contactItems) && !footerItems) {
            return contactItems.map((contactItem) => ({
                ...contactItem,
                icon: undefined,
                slot: 'custom',
            })) as DisplayFooterItem[];
        }

        if (footerItems) {
            // Merge default and user-provided items, giving priority to default
            const reservedItems: ReservedDisplayFooterItem[] = [];
            const customItems: CustomDisplayFooterItem[] = [];

            footerItems.forEach((item, idx) => {
                const uniqueId = item.id + idx;
                if (this.isReservedItem(item)) {
                    reservedItems.push({
                        ...item,
                        id: uniqueId,
                        reservedId: item.id as ReservedFooterID,
                    });
                } else {
                    customItems.push({...item, id: uniqueId} as CustomDisplayFooterItem);
                }
            });
            return (
                reservedItems.sort(
                    (a, b) => reservedIds.indexOf(a.reservedId) - reservedIds.indexOf(b.reservedId),
                ) as DisplayFooterItem[]
            ).concat(customItems);
        }

        return null;
    }

    private getDefaultFooterItem(): DisplayFooterItem[] {
        const {withReport, featureLink, supportLink, installationType, env} = this.props;
        const innerWithReport = typeof withReport === 'boolean' ? withReport : true;
        const innerFeatureLink =
            featureLink === false ? undefined : (featureLink ?? getFeatureLink(installationType));
        const innerSupportLink =
            supportLink === false
                ? undefined
                : (supportLink ?? getSupportLink(env, installationType));
        const result: ContactItem[] = [];

        if (innerWithReport) {
            result.push(getReportContactItem());
        }
        if (innerFeatureLink) {
            result.push(getProposalContactItem(innerFeatureLink));
        }
        if (innerSupportLink) {
            result.push(getSupportContactItem(innerSupportLink));
        }

        return result as unknown as DisplayFooterItem[];
    }

    private renderSingleCategory(docsItems: DocsItems[] = []) {
        const items = docsItems.reduce<(DocsDividerItem | DocsItem[])[]>((result, item) => {
            if ((item as DocsDividerItem)?.type === 'divider') {
                result.push(item as DocsDividerItem);
                return result;
            }
            const prev = result[result.length - 1];
            if (Array.isArray(prev)) {
                prev.push(item as DocsItem);
            } else {
                result.push([item as DocsItem]);
            }

            return result;
        }, []);

        return (
            <div className={b('docs-list-wrap')}>
                {items.map((item, index) =>
                    Array.isArray(item) ? (
                        <List
                            key={index}
                            items={item}
                            filterable={false}
                            virtualized={false}
                            renderItem={this.renderDocsItem.bind(this)}
                            itemClassName={b('item')}
                        />
                    ) : (
                        <div className={b('docs-divider')} key={index} />
                    ),
                )}
            </div>
        );
    }

    private renderDocsItem(item: DocsItem) {
        const {docsItemClassName} = this.props;

        const {text, url, hint, itemWrapper, linkExtra = {}} = item;
        const title = hint ?? (typeof text === 'string' ? text : undefined);
        if (typeof itemWrapper === 'function') {
            return itemWrapper(item);
        } else if (url) {
            return (
                <Link
                    className={b('docs-link', {}, docsItemClassName)}
                    rel="noopener"
                    target="_blank"
                    href={url}
                    title={title}
                    {...linkExtra}
                >
                    {text}
                </Link>
            );
        } else {
            return text;
        }
    }

    private getRenderFooterItem(hasIcons: boolean) {
        const {footerItemClassName} = this.props;

        const renderFooterItem = (item: DisplayFooterItem) => {
            let icon: React.ReactNode = null;

            if ('reservedId' in item) {
                const svgName = reservedIdIconsMap[item.reservedId];
                icon = <div className={b('icon', {}, svgName)} />;
            } else {
                icon = item.icon;
            }

            const iconWrapper = hasIcons ? <div className={b('item-icon-wrap')}>{icon}</div> : null;

            return (
                <FooterItemComponent item={item} footerItemClassName={footerItemClassName}>
                    {iconWrapper}
                </FooterItemComponent>
            );
        };

        return renderFooterItem;
    }

    private renderDefaultItem(item: DisplayFooterItem) {
        const {footerItemClassName} = this.props;

        return <FooterItemComponent item={item} footerItemClassName={footerItemClassName} />;
    }

    private onFooterItemClick = (item: DisplayFooterItem) => {
        const {onContactItemClick, onFooterItemClick} = this.props;
        const {url, disableClickHandler = true, onClick} = item;
        if (url && disableClickHandler) {
            return;
        }
        const clickFn = onClick || onContactItemClick || onFooterItemClick;
        if (typeof clickFn === 'function') {
            clickFn(item);
        }
    };
}
