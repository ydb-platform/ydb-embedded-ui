import React from 'react';

import {Xmark} from '@gravity-ui/icons';
import {DrawerItem, Drawer as GravityDrawer} from '@gravity-ui/navigation';
import {ActionTooltip, Button, Flex, Icon, Text} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {isNumeric} from '../../utils/utils';
import {CopyLinkButton} from '../CopyLinkButton/CopyLinkButton';

import {useDrawerContext} from './DrawerContext';

const DEFAULT_DRAWER_WIDTH_PERCENTS = 60;
const DEFAULT_DRAWER_WIDTH = 600;
const DRAWER_WIDTH_KEY = 'drawer-width';
const b = cn('ydb-drawer');

import './Drawer.scss';

type DrawerEvent = MouseEvent & {
    _capturedInsideDrawer?: boolean;
};

interface DrawerPaneContentWrapperProps {
    isVisible: boolean;
    onClose: () => void;
    children: React.ReactNode;
    drawerId?: string;
    storageKey?: string;
    direction?: 'left' | 'right';
    className?: string;
    detectClickOutside?: boolean;
    defaultWidth?: number;
    isPercentageWidth?: boolean;
}

const DrawerPaneContentWrapper = ({
    isVisible,
    onClose,
    children,
    drawerId = 'drawer',
    storageKey = DRAWER_WIDTH_KEY,
    defaultWidth,
    direction = 'right',
    className,
    detectClickOutside = false,
    isPercentageWidth,
}: DrawerPaneContentWrapperProps) => {
    const [drawerWidth, setDrawerWidth] = React.useState(() => {
        const savedWidth = localStorage.getItem(storageKey);
        return isNumeric(savedWidth) ? Number(savedWidth) : defaultWidth;
    });

    const drawerRef = React.useRef<HTMLDivElement>(null);
    const {containerWidth} = useDrawerContext();
    // Calculate drawer width based on container width percentage if specified
    const calculatedWidth = React.useMemo(() => {
        if (isPercentageWidth && containerWidth > 0) {
            return Math.round(
                (containerWidth * (drawerWidth || DEFAULT_DRAWER_WIDTH_PERCENTS)) / 100,
            );
        }
        return drawerWidth || DEFAULT_DRAWER_WIDTH;
    }, [containerWidth, isPercentageWidth, drawerWidth]);

    React.useEffect(() => {
        if (!detectClickOutside) {
            return undefined;
        }

        const handleClickOutside = (event: DrawerEvent) => {
            //skip if event is captured inside drawer or not triggered by user
            if (event._capturedInsideDrawer || !event.isTrusted) {
                return;
            }
            if (
                isVisible &&
                drawerRef.current &&
                !drawerRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isVisible, onClose, detectClickOutside]);

    const handleResizeDrawer = (width: number) => {
        if (isPercentageWidth && containerWidth > 0) {
            const percentageWidth = Math.round((width / containerWidth) * 100);
            setDrawerWidth(percentageWidth);
            localStorage.setItem(storageKey, percentageWidth.toString());
        } else {
            setDrawerWidth(width);
            localStorage.setItem(storageKey, width.toString());
        }
    };

    const handleClickInsideDrawer = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        (event.nativeEvent as DrawerEvent)._capturedInsideDrawer = true;
    };

    return (
        <GravityDrawer
            onEscape={onClose}
            onVeilClick={onClose}
            hideVeil
            className={b('container', className)}
        >
            <DrawerItem
                id={drawerId}
                visible={isVisible}
                resizable
                maxResizeWidth={containerWidth}
                width={isPercentageWidth ? calculatedWidth : drawerWidth}
                onResize={handleResizeDrawer}
                direction={direction}
                className={b('item')}
                ref={detectClickOutside ? drawerRef : undefined}
            >
                <div className={b('click-handler')} onClickCapture={handleClickInsideDrawer}>
                    {children}
                </div>
            </DrawerItem>
        </GravityDrawer>
    );
};

type DrawerControl =
    | {type: 'close'}
    | {type: 'copyLink'; link: string}
    | {type: 'custom'; node: React.ReactNode; key: string};

interface DrawerPaneProps {
    children: React.ReactNode;
    renderDrawerContent: () => React.ReactNode;
    isDrawerVisible: boolean;
    onCloseDrawer: () => void;
    drawerId?: string;
    storageKey?: string;
    defaultWidth?: number;
    direction?: 'left' | 'right';
    className?: string;
    detectClickOutside?: boolean;
    isPercentageWidth?: boolean;
    drawerControls?: DrawerControl[];
    title?: React.ReactNode;
    headerClassName?: string;
}

export const DrawerWrapper = ({
    children,
    renderDrawerContent,
    isDrawerVisible,
    onCloseDrawer,
    drawerId,
    storageKey,
    defaultWidth,
    direction,
    className,
    detectClickOutside,
    isPercentageWidth,
    drawerControls = [],
    title,
    headerClassName,
}: DrawerPaneProps) => {
    React.useEffect(() => {
        return () => {
            onCloseDrawer();
        };
    }, [onCloseDrawer]);

    const renderDrawerHeader = () => {
        const controls = [];
        for (const control of drawerControls) {
            switch (control.type) {
                case 'close':
                    controls.push(
                        <ActionTooltip title="Close" key="close">
                            <Button view="flat" onClick={onCloseDrawer}>
                                <Icon data={Xmark} size={16} />
                            </Button>
                        </ActionTooltip>,
                    );
                    break;
                case 'copyLink':
                    controls.push(<CopyLinkButton text={control.link} key="copyLink" />);
                    break;
                case 'custom':
                    controls.push(
                        <React.Fragment key={control.key}>{control.node}</React.Fragment>,
                    );
                    break;
            }
        }

        return (
            <Flex
                justifyContent="space-between"
                alignItems="center"
                className={b('header-wrapper', headerClassName)}
            >
                <Text variant="subheader-2">{title}</Text>
                <Flex className={b('controls')}>{controls}</Flex>
            </Flex>
        );
    };

    return (
        <React.Fragment>
            {children}
            <DrawerPaneContentWrapper
                isVisible={isDrawerVisible}
                onClose={onCloseDrawer}
                drawerId={drawerId}
                storageKey={storageKey}
                defaultWidth={defaultWidth}
                direction={direction}
                className={className}
                detectClickOutside={detectClickOutside}
                isPercentageWidth={isPercentageWidth}
            >
                <div className={b('content-wrapper')}>
                    {renderDrawerHeader()}
                    {renderDrawerContent()}
                </div>
            </DrawerPaneContentWrapper>
        </React.Fragment>
    );
};
