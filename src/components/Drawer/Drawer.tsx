import React from 'react';

import {Xmark} from '@gravity-ui/icons';
import {ActionTooltip, Button, Flex, Drawer as GravityDrawer, Icon, Text} from '@gravity-ui/uikit';
import {debounce} from 'lodash';

import {cn} from '../../utils/cn';
import {useSetting} from '../../utils/hooks/useSetting';
import {CopyLinkButton} from '../CopyLinkButton/CopyLinkButton';

import {useDrawerContext} from './DrawerContext';
import {
    normalizeDrawerWidthFromResize,
    normalizeDrawerWidthFromSavedString,
} from './DrawerWidthUtils';

import './Drawer.scss';

const DEFAULT_DRAWER_WIDTH_PERCENTS = 60;
const DEFAULT_DRAWER_WIDTH = 600;
const DRAWER_WIDTH_KEY = 'drawer-width';
const SAVE_DEBOUNCE_MS = 200;
const b = cn('ydb-drawer');

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
    hideVeil?: boolean;
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
    hideVeil = true,
}: DrawerPaneContentWrapperProps) => {
    const [savedWidthString, setSavedWidthString] = useSetting<string | undefined>(storageKey);
    const [userDrawerWidth, setUserDrawerWidth] = React.useState<number | undefined>(undefined);

    const drawerRef = React.useRef<HTMLDivElement>(null);
    const {containerWidth, itemContainerRef} = useDrawerContext();

    const derivedDrawerWidth = React.useMemo(() => {
        return normalizeDrawerWidthFromSavedString({
            savedWidthString,
            defaultWidth,
            isPercentageWidth,
            containerWidth,
            defaultPercents: DEFAULT_DRAWER_WIDTH_PERCENTS,
            defaultPx: DEFAULT_DRAWER_WIDTH,
        });
    }, [containerWidth, defaultWidth, isPercentageWidth, savedWidthString]);

    const drawerWidth = userDrawerWidth ?? derivedDrawerWidth;

    // Calculate drawer width based on container width percentage if specified
    const calculatedWidth = React.useMemo(() => {
        if (isPercentageWidth && containerWidth > 0) {
            return Math.round(
                (containerWidth * (drawerWidth || DEFAULT_DRAWER_WIDTH_PERCENTS)) / 100,
            );
        }
        return drawerWidth || DEFAULT_DRAWER_WIDTH;
    }, [containerWidth, isPercentageWidth, drawerWidth]);

    const drawerOverlayStyle = React.useMemo<React.CSSProperties>(() => {
        return {
            overflow: 'hidden',
            ...(containerWidth > 0 ? {width: containerWidth} : {}),
        };
    }, [containerWidth]);

    React.useEffect(() => {
        if (!detectClickOutside || !isVisible) {
            return undefined;
        }

        const handleClickOutside = (event: DrawerEvent) => {
            if (event._capturedInsideDrawer || !event.isTrusted) {
                return;
            }

            if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        // Keep the document listener in the bubble phase so row clicks may stop propagation
        // and switch drawer content without closing it. Attach it after the opening click.
        const listenerTimeoutId = window.setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);

        return () => {
            window.clearTimeout(listenerTimeoutId);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isVisible, onClose, detectClickOutside]);

    const saveWidthDebounced = React.useMemo(() => {
        return debounce((value: string) => setSavedWidthString(value), SAVE_DEBOUNCE_MS);
    }, [setSavedWidthString]);

    React.useEffect(() => {
        return () => {
            saveWidthDebounced.cancel();
        };
    }, [saveWidthDebounced]);

    const handleResizeDrawer = React.useCallback(
        (width: number) => {
            const normalized = normalizeDrawerWidthFromResize({
                resizedWidthPx: width,
                isPercentageWidth,
                containerWidth,
            });

            setUserDrawerWidth(normalized.drawerWidth);
            saveWidthDebounced(normalized.savedWidthString);
        },
        [containerWidth, isPercentageWidth, saveWidthDebounced],
    );

    const handleOpenChange = React.useCallback(
        (open: boolean) => {
            if (!open) {
                onClose();
            }
        },
        [onClose],
    );

    const handleClickInsideDrawer = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const nativeEvent = event.nativeEvent as DrawerEvent;
        nativeEvent._capturedInsideDrawer = true;
    };

    const itemContainer = itemContainerRef?.current;
    if (!itemContainer) {
        return null;
    }

    return (
        <GravityDrawer
            qa={drawerId}
            open={isVisible}
            onOpenChange={handleOpenChange}
            placement={direction}
            hideVeil={hideVeil}
            className={b('container', className)}
            contentClassName={b('item')}
            style={drawerOverlayStyle}
            container={itemContainer}
            resizable
            maxSize={containerWidth || undefined}
            size={calculatedWidth}
            onResizeEnd={handleResizeDrawer}
            disableBodyScrollLock
            disableOutsideClick={detectClickOutside}
            floatingRef={detectClickOutside ? drawerRef : undefined}
        >
            <div className={b('click-handler')} onClickCapture={handleClickInsideDrawer}>
                {children}
            </div>
        </GravityDrawer>
    );
};

export type DrawerControl =
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
    hideVeil?: boolean;
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
    hideVeil,
}: DrawerPaneProps) => {
    const onCloseDrawerRef = React.useRef(onCloseDrawer);

    React.useEffect(() => {
        onCloseDrawerRef.current = onCloseDrawer;
    }, [onCloseDrawer]);

    React.useEffect(() => {
        return () => {
            onCloseDrawerRef.current();
        };
    }, []);

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
                hideVeil={hideVeil}
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
                {isDrawerVisible ? (
                    <div className={b('content-wrapper')}>
                        {renderDrawerHeader()}
                        {renderDrawerContent()}
                    </div>
                ) : null}
            </DrawerPaneContentWrapper>
        </React.Fragment>
    );
};
