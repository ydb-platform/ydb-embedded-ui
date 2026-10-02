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

interface DrawerPaneContentWrapperProps {
    labelledBy?: string;
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
    disableModal?: boolean;
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
    disableModal = false,
    labelledBy,
}: DrawerPaneContentWrapperProps) => {
    const [savedWidthString, setSavedWidthString] = useSetting<string | undefined>(storageKey);
    const [userDrawerWidth, setUserDrawerWidth] = React.useState<number | undefined>(undefined);

    const drawerRef = React.useRef<HTMLDivElement>(null);
    const openerRef = React.useRef<HTMLElement | null>(null);

    // Floating UI suppresses return focus after focus-out, even if the drawer stays open.
    React.useLayoutEffect(() => {
        if (!disableModal) {
            return;
        }
        const activeElement = document.activeElement;
        if (isVisible) {
            if (
                activeElement instanceof HTMLElement &&
                !drawerRef.current?.contains(activeElement)
            ) {
                openerRef.current = activeElement;
            }
        } else {
            if (
                (drawerRef.current?.contains(activeElement) || activeElement === document.body) &&
                openerRef.current?.isConnected
            ) {
                openerRef.current.focus();
            }
            openerRef.current = null;
        }
    }, [disableModal, isVisible]);
    const {containerWidth, itemContainerRef, rightInset, visibleRightInset} =
        useDrawerContextInternal();
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

    // Calculate drawer width based on container width percentage if specified
    const requestedWidth = React.useMemo(() => {
        if (isPercentageWidth && containerWidth > 0) {
            return Math.round(
                (containerWidth * (requestedDrawerWidth || DEFAULT_DRAWER_WIDTH_PERCENTS)) / 100,
            );
        }
        return requestedDrawerWidth || DEFAULT_DRAWER_WIDTH;
    }, [containerWidth, isPercentageWidth, requestedDrawerWidth]);
    const calculatedWidth = Math.min(requestedWidth, availableWidth);

    const drawerOverlayStyle = React.useMemo<React.CSSProperties>(() => {
        return {
            overflow: 'hidden',
            width: availableWidth,
        };
    }, [availableWidth]);

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

        // Keep the document listener in the bubble phase so row clicks may stop propagation
        // and switch drawer content without closing it. Attach it after the opening click.
        const listenerTimeoutId = window.setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);

        return () => {
            window.clearTimeout(listenerTimeoutId);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [detectClickOutside, isVisible, itemContainerRef, onClose, rightInset]);

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

    const handleOpenChange = React.useCallback<
        NonNullable<React.ComponentProps<typeof GravityDrawer>['onOpenChange']>
    >(
        (open, _event, reason) => {
            if (!open && !(disableModal && reason === 'focus-out')) {
                onClose();
            }
        },
        [disableModal, onClose],
    );

    const handleClickInsideDrawer = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const nativeEvent = event.nativeEvent as DrawerEvent;
        nativeEvent._capturedInsideDrawer = true;
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (
            disableModal &&
            event.key === 'Escape' &&
            !event.defaultPrevented &&
            !event.nativeEvent.isComposing &&
            event.target instanceof Element &&
            event.target.closest('[role="dialog"]') === drawerRef.current
        ) {
            event.preventDefault();
            event.stopPropagation();
            onClose();
        }
    };

    const itemContainer = itemContainerRef?.current;
    if (!itemContainer) {
        return null;
    }

    return (
        <div
            className={b('click-handler')}
            onClickCapture={handleClickInsideDrawer}
            onKeyDown={handleKeyDown}
        >
            <GravityDrawer
                qa={drawerId}
                open={isVisible}
                onOpenChange={handleOpenChange}
                onTransitionInComplete={onTransitionInComplete}
                placement={direction}
                hideVeil={hideVeil}
                className={b('container', className)}
                contentClassName={b('item')}
                style={drawerOverlayStyle}
                container={itemContainer}
                resizable
                maxSize={availableWidth}
                size={calculatedWidth}
                onResizeEnd={handleResizeDrawer}
                aria-labelledby={labelledBy}
                disableModal={disableModal}
                disableEscapeKeyDown={disableModal}
                disableBodyScrollLock
                disableOutsideClick={detectClickOutside}
                floatingRef={drawerRef}
                returnFocus={disableModal ? false : undefined}
            >
                {children}
            </GravityDrawer>
        </div>
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
    disableModal?: boolean;
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
    disableModal,
}: DrawerPaneProps) => {
    const titleId = React.useId();
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
                <Text id={titleId} variant="subheader-2">
                    {title}
                </Text>
                <Flex className={b('controls')}>{controls}</Flex>
            </Flex>
        );
    };

    return (
        <React.Fragment>
            {children}
            <DrawerPaneContentWrapper
                hideVeil={hideVeil}
                disableModal={disableModal}
                labelledBy={title ? titleId : undefined}
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
