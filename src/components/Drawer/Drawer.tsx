import React from 'react';

import {Xmark} from '@gravity-ui/icons';
import {ActionTooltip, Button, Flex, Drawer as GravityDrawer, Icon, Text} from '@gravity-ui/uikit';
import {debounce} from 'lodash';

import {cn} from '../../utils/cn';
import {useSetting} from '../../utils/hooks/useSetting';
import {CopyLinkButton} from '../CopyLinkButton/CopyLinkButton';

import {isClickInRightInset, useDrawerContextInternal} from './DrawerContext';
import {
    normalizeDrawerWidthFromResize,
    normalizeDrawerWidthFromSavedString,
} from './DrawerWidthUtils';
import i18n from './i18n';

import './Drawer.scss';

const DEFAULT_DRAWER_WIDTH_PERCENTS = 60;
const DEFAULT_DRAWER_WIDTH = 600;
const DRAWER_WIDTH_KEY = 'drawer-width';
const SAVE_DEBOUNCE_MS = 200;
const b = cn('ydb-drawer');

type DrawerEvent = MouseEvent & {
    _capturedInsideDrawer?: boolean;
};

export interface DrawerSurfaceProps {
    open: boolean;
    onClose: () => void;
    onTransitionInComplete?: () => void;
    width: number;
    availableWidth: number;
    qa: string;
    onResizeEnd: (width: number) => void;
    renderContent: () => React.ReactNode;
    renderDefault: () => React.ReactNode;
}

interface DrawerPaneContentWrapperProps {
    isVisible: boolean;
    onClose: () => void;
    onTransitionInComplete?: () => void;
    children: React.ReactNode;
    drawerId?: string;
    storageKey?: string;
    direction?: 'left' | 'right';
    className?: string;
    detectClickOutside?: boolean;
    defaultWidth?: number;
    isPercentageWidth?: boolean;
    hideVeil?: boolean;
    renderSurface?: React.ComponentType<DrawerSurfaceProps>;
}

function DefaultDrawerSurface({
    isVisible,
    onClose,
    onTransitionInComplete,
    children,
    drawerId,
    direction,
    className,
    detectClickOutside = false,
    hideVeil,
    width,
    availableWidth,
    onResizeEnd,
}: DrawerPaneContentWrapperProps & {
    width: number;
    availableWidth: number;
    onResizeEnd: (width: number) => void;
}) {
    const drawerRef = React.useRef<HTMLDivElement>(null);
    const {itemContainerRef, rightInset} = useDrawerContextInternal();
    const style = React.useMemo<React.CSSProperties>(
        () => ({overflow: 'hidden', width: availableWidth}),
        [availableWidth],
    );

    React.useEffect(() => {
        if (!detectClickOutside || !isVisible) {
            return undefined;
        }

        const handleClickOutside = (event: DrawerEvent) => {
            if (
                event._capturedInsideDrawer ||
                !event.isTrusted ||
                isClickInRightInset(event, itemContainerRef?.current ?? null, rightInset)
            ) {
                return;
            }

            if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        // Attach after the opening click; row handlers may stop bubbling to switch the target.
        const listenerTimeoutId = window.setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);

        return () => {
            window.clearTimeout(listenerTimeoutId);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [detectClickOutside, isVisible, itemContainerRef, onClose, rightInset]);

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
            onOpenChange={(open) => {
                if (!open) {
                    onClose();
                }
            }}
            onTransitionInComplete={onTransitionInComplete}
            placement={direction}
            hideVeil={hideVeil}
            className={b('container', className)}
            contentClassName={b('item')}
            style={style}
            container={itemContainer}
            resizable
            maxSize={availableWidth}
            size={width}
            onResizeEnd={onResizeEnd}
            disableBodyScrollLock
            disableOutsideClick={detectClickOutside || hideVeil}
            floatingRef={detectClickOutside ? drawerRef : undefined}
        >
            <div className={b('click-handler')} onClickCapture={handleClickInsideDrawer}>
                {isVisible ? children : null}
            </div>
        </GravityDrawer>
    );
}

const DrawerPaneContentWrapper = ({
    isVisible,
    onClose,
    onTransitionInComplete,
    children,
    drawerId = 'drawer',
    storageKey = DRAWER_WIDTH_KEY,
    defaultWidth,
    direction = 'right',
    className,
    detectClickOutside = false,
    isPercentageWidth,
    hideVeil = true,
    renderSurface: Surface,
}: DrawerPaneContentWrapperProps) => {
    const [savedWidthString, setSavedWidthString] = useSetting<string | undefined>(storageKey);
    const [userDrawerWidth, setUserDrawerWidth] = React.useState<number | undefined>(undefined);
    const {containerWidth, visibleRightInset} = useDrawerContextInternal();
    const availableWidth = Math.max(0, containerWidth - visibleRightInset);

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

    const requestedDrawerWidth = userDrawerWidth ?? derivedDrawerWidth;
    const requestedWidth = React.useMemo(() => {
        if (isPercentageWidth && containerWidth > 0) {
            return Math.round(
                (containerWidth * (requestedDrawerWidth || DEFAULT_DRAWER_WIDTH_PERCENTS)) / 100,
            );
        }
        return requestedDrawerWidth || DEFAULT_DRAWER_WIDTH;
    }, [containerWidth, isPercentageWidth, requestedDrawerWidth]);

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

    const renderDefault = () => (
        <DefaultDrawerSurface
            isVisible={isVisible}
            onClose={onClose}
            onTransitionInComplete={onTransitionInComplete}
            drawerId={drawerId}
            direction={direction}
            className={className}
            detectClickOutside={detectClickOutside}
            hideVeil={hideVeil}
            width={Math.min(requestedWidth, availableWidth)}
            availableWidth={availableWidth}
            onResizeEnd={handleResizeDrawer}
        >
            {children}
        </DefaultDrawerSurface>
    );

    return Surface ? (
        <Surface
            open={isVisible}
            onClose={onClose}
            onTransitionInComplete={onTransitionInComplete}
            width={requestedWidth}
            availableWidth={availableWidth}
            qa={drawerId}
            onResizeEnd={handleResizeDrawer}
            renderContent={() => children}
            renderDefault={renderDefault}
        />
    ) : (
        renderDefault()
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
    onTransitionInComplete?: () => void;
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
    renderSurface?: React.ComponentType<DrawerSurfaceProps>;
}

export const DrawerWrapper = ({
    children,
    renderDrawerContent,
    isDrawerVisible,
    onCloseDrawer,
    onTransitionInComplete,
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
    renderSurface,
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
        const closeTitle = i18n('action_close');
        const controls = [];
        for (const control of drawerControls) {
            switch (control.type) {
                case 'close':
                    controls.push(
                        <ActionTooltip title={closeTitle} key="close">
                            <Button view="flat" onClick={onCloseDrawer} aria-label={closeTitle}>
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
                onTransitionInComplete={onTransitionInComplete}
                drawerId={drawerId}
                storageKey={storageKey}
                defaultWidth={defaultWidth}
                direction={direction}
                className={className}
                detectClickOutside={detectClickOutside}
                isPercentageWidth={isPercentageWidth}
                renderSurface={renderSurface}
            >
                {isDrawerVisible || renderSurface ? (
                    <div className={b('content-wrapper')}>
                        {renderDrawerHeader()}
                        {renderDrawerContent()}
                    </div>
                ) : null}
            </DrawerPaneContentWrapper>
        </React.Fragment>
    );
};
