import React from 'react';

import {cn} from '../../utils/cn';

import './Drawer.scss';

const b = cn('ydb-drawer');

export interface DrawerContextType {
    containerWidth: number;
    itemContainerRef: React.RefObject<HTMLDivElement> | null;
    rightInset: number;
    setContainerWidth: React.Dispatch<React.SetStateAction<number>>;
    setRightInset: React.Dispatch<React.SetStateAction<number>>;
}

const DrawerContext = React.createContext<DrawerContextType>({
    containerWidth: 0,
    itemContainerRef: null,
    rightInset: 0,
    setContainerWidth: () => {},
    setRightInset: () => {},
});

interface DrawerContextProviderProps {
    children: React.ReactNode;
    className?: string;
    rightInset?: number;
    onRightInsetChange?: (rightInset: number) => void;
}

function normalizeRightInset(rightInset: number) {
    return Number.isFinite(rightInset) ? Math.max(0, rightInset) : 0;
}

export function isClickInRightInset(
    event: Pick<MouseEvent, 'clientX'>,
    itemContainer: HTMLElement | null,
    rightInset: number,
) {
    if (rightInset <= 0 || !itemContainer) {
        return false;
    }
    return event.clientX >= itemContainer.getBoundingClientRect().right;
}

export const DrawerContextProvider = ({
    children,
    className,
    rightInset: controlledRightInset,
    onRightInsetChange,
}: DrawerContextProviderProps) => {
    const [measuredContainerWidth, setContainerWidth] = React.useState(0);
    const [internalRightInset, setInternalRightInset] = React.useState(0);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const itemContainerRef = React.useRef<HTMLDivElement>(null);
    const rightInset = normalizeRightInset(controlledRightInset ?? internalRightInset);
    const containerWidth = Math.max(0, measuredContainerWidth - rightInset);
    const rightInsetRef = React.useRef(rightInset);
    rightInsetRef.current = rightInset;

    const setRightInset = React.useCallback<React.Dispatch<React.SetStateAction<number>>>(
        (nextRightInset) => {
            const nextValue = normalizeRightInset(
                typeof nextRightInset === 'function'
                    ? nextRightInset(rightInsetRef.current)
                    : nextRightInset,
            );
            if (controlledRightInset === undefined) {
                setInternalRightInset(nextValue);
            }
            onRightInsetChange?.(nextValue);
        },
        [controlledRightInset, onRightInsetChange],
    );

    React.useEffect(() => {
        if (!containerRef.current) {
            return undefined;
        }

        const updateWidth = () => {
            if (containerRef.current) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const visibleLeft = Math.max(containerRect.left, 0);
                const visibleRight = Math.min(containerRect.right, window.innerWidth);
                const visibleWidth = Math.max(0, visibleRight - visibleLeft);

                setContainerWidth(visibleWidth || containerRef.current.clientWidth);
            }
        };

        // Set initial width
        updateWidth();

        // Update width on resize
        const resizeObserver = new ResizeObserver(updateWidth);
        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Memoize the context value to prevent unnecessary re-renders
    const value = React.useMemo(
        () => ({
            containerWidth,
            setContainerWidth,
            itemContainerRef,
            rightInset,
            setRightInset,
        }),
        [containerWidth, rightInset, setRightInset],
    );
    const itemContainerStyle = React.useMemo<React.CSSProperties | undefined>(() => {
        if (rightInset === 0) {
            return undefined;
        }
        return {width: `max(0px, calc(100% - ${rightInset}px))`};
    }, [rightInset]);

    return (
        <DrawerContext.Provider value={value}>
            <div ref={containerRef} className={b('drawer-container', className)}>
                {children}
                {/* 
                    Children styles should not affect drawer container behaviour 
                    So we mount it out of children in a separate portal
                */}
                <div
                    ref={itemContainerRef}
                    className={b('item-container')}
                    style={itemContainerStyle}
                />
            </div>
        </DrawerContext.Provider>
    );
};

export const useDrawerContext = (): DrawerContextType => {
    const context = React.useContext(DrawerContext);

    if (context === undefined) {
        throw Error('useDrawerContext must be used within a DrawerContextProvider');
    }

    return context;
};
