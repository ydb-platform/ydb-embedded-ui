import React from 'react';
import block from 'bem-cn-lite';
import noop from 'lodash/noop';
import throttle from 'lodash/throttle';

import {Button, Icon} from '@yandex-cloud/uikit';

import {Drawer, DrawerItem} from './Drawer';
import {Logo, LogoProps} from './Logo/Logo';
import {CompositeBar} from './CompositeBar/CompositeBar';
import {AsideHeaderFooterItem} from './AsideHeaderFooterItem/AsideHeaderFooterItem';
import {Content, RenderContentType} from './Content/Content';
import {AsideHeaderMenuItem} from './types';
import {
    ASIDE_HEADER_COLLAPSE_BUTTON_SIZE,
    ASIDE_HEADER_COMPACT_WIDTH,
    ASIDE_HEADER_EXPANDED_WIDTH,
    AsideHeaderEvent,
    AsideHeaderVisibleItem,
    FooterItemIconView,
} from './constants';
import i18n from './i18n';

import {getLocalData, setLocalData} from './helpers';
import {SetSlotsContext, SlotsProvider} from './AsideHeaderFooterSlot/SlotsContext';
import {SlotName} from './AsideHeaderFooterSlot/AsideHeaderFooterSlot';

import controlMenuButton from '../../assets/icons/control-menu-button.svg';

import './AsideHeader.scss';
import {Lang} from '../../utils/i18n';

const b = block('nv-aside-header');

export type {AsideHeaderMenuItem};

interface AsideHeaderGeneralProps
    extends Pick<
        LogoProps,
        | 'onLogoIconClick'
        | 'logoText'
        | 'logoIcon'
        | 'logoIconClassName'
        | 'logoIconSize'
        | 'logoTextSize'
        | 'logoHref'
        | 'logoWrapper'
    > {
    className?: string;
    panelClassName?: string;
    renderContent?: RenderContentType;
    renderPanel?: () => React.ReactNode;
    lang?: Lang;
    renderFooter?: (data: {
        size: number;
        isCompact: boolean;
        asideRef: React.RefObject<HTMLDivElement>;
    }) => React.ReactNode;
    onEvent?: (event: AsideHeaderEvent) => void;
    settings?: React.ReactNode;
    settingsIconWithBadge?: boolean;
    onChangeCompact?: (compact: boolean) => void;
    isCompact?: boolean;
    initIsCompact?: boolean;
}

interface AsideHeaderDefaultProps {
    menuItems: AsideHeaderMenuItem[];
    panelVisible: boolean;
    onClosePanel: () => void;
}

export interface AsideHeaderProps
    extends AsideHeaderGeneralProps,
        Partial<AsideHeaderDefaultProps> {}

type AsideHeaderInnerProps = AsideHeaderGeneralProps & AsideHeaderDefaultProps;

interface AsideHeaderState {
    visibleItem: AsideHeaderVisibleItem | null;
    isCompact: boolean;
    isButtonVisible: boolean;
}

export {AsideHeaderFooterItem};

export {SlotName};

export class AsideHeader extends React.Component<AsideHeaderInnerProps, AsideHeaderState> {
    static getDerivedStateFromProps(props: AsideHeaderInnerProps, state: AsideHeaderState) {
        if (typeof props.isCompact !== 'undefined') {
            const newState: Partial<AsideHeaderState> = {
                isCompact: props.isCompact,
            };
            if ((!props.isCompact || !state.isCompact) && !state.isButtonVisible) {
                newState.isButtonVisible = true;
            }
            return newState;
        }
        return null;
    }

    constructor(props: AsideHeaderInnerProps) {
        super(props);

        this.throttledPageMouseMove = throttle(this.onPageMouseMove, 300);

        const isCompact =
            typeof getLocalData()?.isCompact === 'boolean'
                ? Boolean(getLocalData()?.isCompact)
                : Boolean(props.initIsCompact);

        this.state = {
            visibleItem: null,
            isCompact,
            isButtonVisible: !isCompact,
        };
    }

    componentDidUpdate(prevProps: AsideHeaderInnerProps, prevState: AsideHeaderState) {
        if (!prevProps.panelVisible && this.props.panelVisible && this.state.visibleItem) {
            this.setState({visibleItem: null});
        }

        if (
            (prevState.visibleItem === AsideHeaderVisibleItem.Settings) !==
            this.isVisibleItem(AsideHeaderVisibleItem.Settings)
        ) {
            this.props.onEvent?.(
                this.isVisibleItem(AsideHeaderVisibleItem.Settings)
                    ? AsideHeaderEvent.SETTINGS_OPEN
                    : AsideHeaderEvent.SETTINGS_CLOSE,
            );
        }
    }

    render() {
        const size = this.state.isCompact
            ? ASIDE_HEADER_COMPACT_WIDTH
            : ASIDE_HEADER_EXPANDED_WIDTH;

        return (
            <div className={b(null, this.props.className)}>
                <div
                    className={b('pane-container')}
                    onMouseMove={(event) => {
                        if (!this.state.isCompact) {
                            return;
                        }
                        event.persist();
                        this.throttledPageMouseMove(event);
                    }}
                >
                    {this.renderFirstPane(size)}
                    {this.renderSecondPane(size)}
                </div>
            </div>
        );
    }

    static defaultProps: AsideHeaderDefaultProps = {
        menuItems: [],
        panelVisible: false,
        onClosePanel: noop,
    };

    asideRef = React.createRef<HTMLDivElement>();

    throttledPageMouseMove: (_event: React.MouseEvent<HTMLDivElement>) => void;

    triggerEvent = (event: AsideHeaderEvent) => {
        switch (event) {
            case AsideHeaderEvent.SETTINGS_OPEN:
                this.onSettingsToggle(true);
                break;
        }
    };

    private renderFirstPane = (size: number) => {
        const {menuItems, panelVisible, renderPanel, panelClassName, settings} = this.props;
        const {isCompact} = this.state;

        return (
            <SlotsProvider>
                <div className={b('aside')} style={{width: size}}>
                    {this.renderCollapseButton()}
                    <div className={b('aside-popup-anchor')} ref={this.asideRef} />
                    <div className={b('aside-content')}>
                        <Logo
                            onLogoIconClick={this.props.onLogoIconClick}
                            logoWrapper={this.props.logoWrapper}
                            logoText={this.props.logoText}
                            logoIcon={this.props.logoIcon}
                            logoIconSize={this.props.logoIconSize}
                            logoTextSize={this.props.logoTextSize}
                            logoHref={this.props.logoHref}
                            logoIconClassName={this.props.logoIconClassName}
                            isCompact={isCompact}
                        />
                        <CompositeBar
                            items={menuItems}
                            isCompact={isCompact}
                            onClickItem={this.onCompositeBarClick}
                        />
                        {this.renderFooter(size)}
                    </div>
                </div>
                <Drawer
                    className={b('drawer')}
                    onVeilClick={this.onCloseDrawer}
                    onEscape={this.onCloseDrawer}
                    style={{left: size}}
                >
                    <DrawerItem visible={panelVisible} className={b('panel', panelClassName)}>
                        {renderPanel?.()}
                    </DrawerItem>
                    <DrawerItem visible={this.isVisibleItem(AsideHeaderVisibleItem.Settings)}>
                        {settings}
                    </DrawerItem>
                </Drawer>
            </SlotsProvider>
        );
    };

    private renderSecondPane = (size: number) => {
        return (
            <Content
                size={size}
                renderContent={this.props.renderContent}
                className={b('content')}
            />
        );
    };

    private renderFooter = (size: number) => {
        const {settings, settingsIconWithBadge} = this.props;
        const {isCompact} = this.state;

        return (
            <SetSlotsContext.Consumer>
                {(registerSlot) => {
                    if (!registerSlot) {
                        return null;
                    }
                    return (
                        <div className={b('footer')}>
                            {this.props.renderFooter?.({
                                size,
                                isCompact,
                                asideRef: this.asideRef,
                            })}
                            <div
                                ref={(node) => {
                                    registerSlot(SlotName.Support, node);
                                }}
                            />
                            <div
                                ref={(node) => {
                                    registerSlot(SlotName.BugReport, node);
                                }}
                            />
                            <div
                                ref={(node) => {
                                    registerSlot(SlotName.Settings, node);
                                }}
                            >
                                {settings ? (
                                    <AsideHeaderFooterItem
                                        slot={SlotName.Settings}
                                        view={
                                            settingsIconWithBadge
                                                ? FooterItemIconView.WithDot
                                                : FooterItemIconView.Normal
                                        }
                                        text={i18n('switch_settings')}
                                        isCompact={isCompact}
                                        isCurrent={this.isVisibleItem(
                                            AsideHeaderVisibleItem.Settings,
                                        )}
                                        onClick={() => this.onSettingsToggle()}
                                    />
                                ) : null}
                            </div>
                            <div
                                ref={(node) => {
                                    registerSlot(SlotName.User, node);
                                }}
                            />
                        </div>
                    );
                }}
            </SetSlotsContext.Consumer>
        );
    };

    private renderCollapseButton = () => {
        const {isCompact, isButtonVisible} = this.state;

        const buttonVisibility = isButtonVisible ? 'visible' : 'hidden';

        return (
            <Button
                className={b('collapse-button', {compact: isCompact})}
                view="flat"
                style={{visibility: buttonVisibility}}
                onClick={this.onCollapseButtonClick}
            >
                <Icon
                    data={controlMenuButton}
                    className={b('collapse-icon')}
                    width="14"
                    height="14"
                />
            </Button>
        );
    };

    private onCollapseButtonClick = () => {
        const newIsCompact = !this.state.isCompact;

        if (typeof this.props.isCompact === 'undefined') {
            setLocalData({isCompact: newIsCompact});
            this.setState({
                isCompact: newIsCompact,
                isButtonVisible: !newIsCompact,
            });
        } else {
            this.setState({isButtonVisible: !newIsCompact});
        }
        if (this.props.onChangeCompact) {
            this.props.onChangeCompact(newIsCompact);
        }
    };

    private onCloseDrawer = () => {
        this.setState({visibleItem: null});
        this.props.onClosePanel?.();
    };

    private onSettingsToggle = (open?: boolean) => {
        let visibleItem;

        if (typeof open === 'undefined') {
            visibleItem = this.getToggledVisibleItem(AsideHeaderVisibleItem.Settings);
        } else {
            visibleItem = open ? AsideHeaderVisibleItem.Settings : null;
        }

        this.setState({visibleItem});
        if (this.props.panelVisible) {
            this.props.onClosePanel?.();
        }
    };

    private isVisibleItem = (item: AsideHeaderVisibleItem) => {
        return item === this.state.visibleItem;
    };

    private getToggledVisibleItem = (item: AsideHeaderVisibleItem) => {
        return !this.isVisibleItem(item) ? item : null;
    };

    private onPageMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        const xPointerCoordinate = event.clientX;

        const hoverArea = ASIDE_HEADER_COMPACT_WIDTH + ASIDE_HEADER_COLLAPSE_BUTTON_SIZE;

        if (
            !this.state.isButtonVisible &&
            xPointerCoordinate <= hoverArea &&
            xPointerCoordinate >= 0
        ) {
            this.setState({isButtonVisible: true});
            return;
        }

        if (
            this.state.isButtonVisible &&
            (xPointerCoordinate > hoverArea || xPointerCoordinate < 0)
        ) {
            this.setState({isButtonVisible: false});
            return;
        }
    };

    private onCompositeBarClick = () => {
        this.setState({visibleItem: null});
    };
}
