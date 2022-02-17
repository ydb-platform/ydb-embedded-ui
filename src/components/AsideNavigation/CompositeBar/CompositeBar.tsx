import React from 'react';
import block from 'bem-cn-lite';
import AutoSizer from 'react-virtualized-auto-sizer';
import {List, Icon, Popup, PopupPlacement} from '@yandex-cloud/uikit';

import {AsideHeaderMenuItem} from '../types';
import i18n from '../i18n';
import {AsideHeaderTooltip} from '../AsideHeaderTooltip/AsideHeaderTooltip';

import dotsIcon from '../../../assets/icons/dots.svg';

import './CompositeBar.scss';

const b = block('nv-composite-bar');
export const ITEM_HEIGHT = 40;
const POPUP_ITEM_HEIGHT = 28;
const COLLAPSE_ITEM_ID = 'nv-collapse-item-id';
const popupPlacement: PopupPlacement = ['right-start', 'right-end', 'right'];

const getSelectedItemIndex = (items: AsideHeaderMenuItem[]) => {
    const index = items.findIndex(({current}) => Boolean(current));
    return index === -1 ? undefined : index;
};

interface ItemProps {
    item: AsideHeaderMenuItem;
    isCompact: boolean;
    collapseItems: AsideHeaderMenuItem[] | null;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onClick?: () => void;
}

const Item: React.FC<ItemProps> = ({item, isCompact, collapseItems, onClick}) => {
    const [tooltipAnchor, setTooltipAnchor] = React.useState<HTMLDivElement | null>(null);
    const [open, toggleOpen] = React.useState<boolean>(false);
    const popupAnchor = React.useRef<HTMLDivElement>(null);

    const tooltipText = item.tooltipText || item.title;
    const iconSize = item.iconSize || 24;
    const isCollapseItem = item.id === COLLAPSE_ITEM_ID;

    const node = (
        <div
            className={b('menu-item')}
            ref={popupAnchor}
            onClick={() => {
                if (typeof item.onItemClick === 'function') {
                    item.onItemClick(item, false);
                }
                if (isCollapseItem) {
                    toggleOpen(!open);
                    setTooltipAnchor(null);
                }
                onClick?.();
            }}
        >
            <div className={b('menu-icon-place')}>
                {isCompact ? (
                    <React.Fragment>
                        <div
                            onMouseEnter={(event) => !open && setTooltipAnchor(event.currentTarget)}
                            onMouseLeave={() => setTooltipAnchor(null)}
                            className={b('btn-icon', {current: Boolean(item.current)})}
                        >
                            {item.icon && (
                                <Icon data={item.icon} size={iconSize} className={b('menu-icon')} />
                            )}
                        </div>
                        <AsideHeaderTooltip anchor={tooltipAnchor} text={tooltipText} />
                    </React.Fragment>
                ) : (
                    item.icon && (
                        <Icon data={item.icon} size={iconSize} className={b('menu-icon')} />
                    )
                )}
            </div>
            <div className={b('menu-title')} title={item.title}>
                {item.title}
            </div>
            {isCollapseItem && Array.isArray(collapseItems) && Boolean(popupAnchor.current) && (
                <Popup
                    placement={popupPlacement}
                    open={open}
                    anchorRef={popupAnchor}
                    onClose={() => toggleOpen(false)}
                >
                    <div className={b('collapse-items-popup-content')}>
                        <List
                            itemClassName={b('root-collapse-item')}
                            items={collapseItems}
                            selectedItemIndex={getSelectedItemIndex(collapseItems)}
                            itemHeight={POPUP_ITEM_HEIGHT}
                            itemsHeight={collapseItems.length * POPUP_ITEM_HEIGHT}
                            virtualized={false}
                            filterable={false}
                            sortable={false}
                            renderItem={(collapseItem) => {
                                const collapseNode = (
                                    <div
                                        className={b('collapse-item')}
                                        onClick={() => {
                                            if (typeof collapseItem.onItemClick === 'function') {
                                                collapseItem.onItemClick(collapseItem, true);
                                            }
                                        }}
                                    >
                                        {collapseItem.title}
                                    </div>
                                );
                                if (typeof collapseItem.itemWrapper === 'function') {
                                    return collapseItem.itemWrapper(
                                        collapseNode,
                                        collapseItem,
                                        true,
                                        isCompact,
                                    );
                                }

                                return collapseItem.link ? (
                                    <a href={collapseItem.link} className={b('link')}>
                                        {collapseNode}
                                    </a>
                                ) : (
                                    collapseNode
                                );
                            }}
                        />
                    </div>
                </Popup>
            )}
        </div>
    );

    if (typeof item.itemWrapper === 'function') {
        return item.itemWrapper(node, item, false, isCompact) as React.ReactElement;
    }

    return item.link ? (
        <a href={item.link} className={b('link')}>
            {node}
        </a>
    ) : (
        node
    );
};
Item.displayName = 'Item';

interface CompositeBarProps {
    items: AsideHeaderMenuItem[];
    isCompact: boolean;
    onClickItem?: (item: AsideHeaderMenuItem) => void;
}

interface CompositeBarState {
    height: string | number;
    activeItemIndex?: number;
}

interface OnResizeArgs {
    width: number;
    height: number;
}

export class CompositeBar extends React.Component<CompositeBarProps> {
    render() {
        return (
            <React.Fragment>
                <div className={b()} style={{height: this.state.height}}>
                    {this.props.items.length !== 0 && (
                        <AutoSizer onResize={this.onResize}>
                            {({width, height}) => {
                                const style = {
                                    width,
                                    height,
                                };
                                return <div style={style}>{this.renderMenu(height)}</div>;
                            }}
                        </AutoSizer>
                    )}
                </div>
            </React.Fragment>
        );
    }

    state: CompositeBarState = {
        height: 'auto',
        activeItemIndex: undefined,
    };

    private currentItemsCount = 0;
    private skipCheckResize = false;

    private onResize = ({height}: OnResizeArgs) => {
        if (this.skipCheckResize) {
            this.skipCheckResize = false;
            return;
        }

        const desiredHeight = this.currentItemsCount * ITEM_HEIGHT;
        if (height < desiredHeight) {
            if (this.state.height !== desiredHeight) {
                this.skipCheckResize = true;
                this.setState({height: desiredHeight});
            }
        } else if (this.state.height !== 'auto') {
            this.skipCheckResize = true;
            this.setState({height: 'auto'});
        }
    };

    private renderMenu(height: number) {
        const {items, isCompact, onClickItem} = this.props;
        const capacity = Math.max(1, Math.floor(height / ITEM_HEIGHT));
        let listItems: AsideHeaderMenuItem[] | null;
        let collapseItems: AsideHeaderMenuItem[] | null = null;
        if (capacity === 1) {
            listItems = items.filter((item) => item.pinned);
            collapseItems = [...items.filter((item) => !item.pinned)];
            if (collapseItems.length > 0) {
                listItems.push(this.getCollapseItem());
            }
        } else if (capacity < items.length) {
            const extraCount = items.filter(
                (item, idx) => item.pinned && idx >= capacity - 1,
            ).length;
            const pinnedFlag = items.reduceRight(
                (acc, curr, idx) => {
                    const useExtraCount = !curr.pinned && idx < capacity - 1 && acc.extraCount > 0;
                    acc.flags.unshift(curr.pinned || useExtraCount);
                    return {
                        flags: acc.flags,
                        extraCount: acc.extraCount - Number(useExtraCount),
                    };
                },
                {flags: [] as boolean[], extraCount},
            ).flags;
            listItems = items.filter(
                (item, idx) => item.pinned || (idx < capacity - 1 && !pinnedFlag[idx]),
            );
            collapseItems = items.filter(
                (item, idx) => !item.pinned && (idx >= capacity - 1 || pinnedFlag[idx]),
            );
            if (collapseItems.length > 0) {
                listItems.push(this.getCollapseItem());
            }
        } else {
            listItems = [...items];
        }
        this.currentItemsCount = listItems.length;

        return (
            <List
                items={listItems}
                selectedItemIndex={isCompact ? undefined : getSelectedItemIndex(listItems)}
                itemHeight={ITEM_HEIGHT}
                itemClassName={b('root-menu-item', {compact: isCompact})}
                itemsHeight={listItems.length * ITEM_HEIGHT}
                virtualized={false}
                filterable={false}
                sortable={false}
                renderItem={(item) => (
                    <Item
                        item={item}
                        isCompact={isCompact}
                        collapseItems={collapseItems}
                        onClick={() => onClickItem?.(item)}
                    />
                )}
            />
        );
    }

    private getCollapseItem(): AsideHeaderMenuItem {
        return {
            id: COLLAPSE_ITEM_ID,
            title: i18n('label_more'),
            icon: dotsIcon,
            iconSize: 16,
        };
    }
}
