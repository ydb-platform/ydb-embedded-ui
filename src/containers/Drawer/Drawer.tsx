import React from 'react';

import {DrawerItem, Drawer as GravityDrawer} from '@gravity-ui/navigation';

import {cn} from '../../utils/cn';

const DEFAULT_DRAWER_WIDTH = 600;
const DRAWER_WIDTH_KEY = 'drawer-width';
const b = cn('ydb-drawer');

import './Drawer.scss';

interface ContainerProps {
    children: React.ReactNode;
    className?: string;
}

interface WrapperProps {
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
}

interface ContentWrapperProps {
    isVisible: boolean;
    onClose: () => void;
    children: React.ReactNode;
    drawerId?: string;
    storageKey?: string;
    defaultWidth?: number;
    direction?: 'left' | 'right';
    className?: string;
    detectClickOutside?: boolean;
}

const ContentWrapper = ({
    isVisible,
    onClose,
    children,
    drawerId = 'drawer',
    storageKey = DRAWER_WIDTH_KEY,
    defaultWidth = DEFAULT_DRAWER_WIDTH,
    direction = 'right',
    className,
    detectClickOutside = false,
}: ContentWrapperProps) => {
    const [drawerWidth, setDrawerWidth] = React.useState(() => {
        const savedWidth = localStorage.getItem(storageKey);
        return savedWidth ? Number(savedWidth) : defaultWidth;
    });

    const drawerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!detectClickOutside) {
            return undefined;
        }

        const handleClickOutside = (event: MouseEvent) => {
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
        setDrawerWidth(width);
        localStorage.setItem(storageKey, width.toString());
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
                width={drawerWidth}
                onResize={handleResizeDrawer}
                direction={direction}
                className={b('item')}
                ref={detectClickOutside ? drawerRef : undefined}
            >
                {children}
            </DrawerItem>
        </GravityDrawer>
    );
};

export const Drawer = {
    Container: ({children, className}: ContainerProps) => {
        return <div className={b('drawer-container', className)}>{children}</div>;
    },

    Wrapper: ({
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
    }: WrapperProps) => {
        React.useEffect(() => {
            return () => {
                onCloseDrawer();
            };
        }, [onCloseDrawer]);
        return (
            <React.Fragment>
                {children}
                <ContentWrapper
                    isVisible={isDrawerVisible}
                    onClose={onCloseDrawer}
                    drawerId={drawerId}
                    storageKey={storageKey}
                    defaultWidth={defaultWidth}
                    direction={direction}
                    className={className}
                    detectClickOutside={detectClickOutside}
                >
                    {renderDrawerContent()}
                </ContentWrapper>
            </React.Fragment>
        );
    },
};
