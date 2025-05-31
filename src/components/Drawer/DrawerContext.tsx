import React from 'react';

import {cn} from '../../utils/cn';

import './Drawer.scss';

const b = cn('ydb-drawer');

export interface DrawerContextType {
    containerWidth: number;
    itemContainerRef: React.RefObject<HTMLDivElement> | null;
    setContainerWidth: React.Dispatch<React.SetStateAction<number>>;
}

const DrawerContext = React.createContext<DrawerContextType>({
    containerWidth: 0,
    itemContainerRef: null,
    setContainerWidth: () => {},
});

interface DrawerContextProviderProps {
    children: React.ReactNode;
    className?: string;
}

export const DrawerContextProvider = ({children, className}: DrawerContextProviderProps) => {
    const [containerWidth, setContainerWidth] = React.useState(0);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const itemContainerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!containerRef.current) {
            return undefined;
        }

        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.clientWidth);
            }
        };

        // Set initial width
        updateWidth();

        // Update width on resize
        const resizeObserver = new ResizeObserver(updateWidth);
        resizeObserver.observe(containerRef.current);

        return () => {
            if (containerRef.current) {
                resizeObserver.disconnect();
            }
        };
    }, []);

    // Memoize the context value to prevent unnecessary re-renders
    const value = React.useMemo(
        () => ({
            containerWidth,
            setContainerWidth,
            itemContainerRef,
        }),
        [containerWidth],
    );

    return (
        <DrawerContext.Provider value={value}>
            <div ref={containerRef} className={b('drawer-container', className)}>
                {children}
                {/* 
                    Children styles should not affect drawer container behaviour 
                    So we mount it out of children in a separate portal
                */}
                <div ref={itemContainerRef} className={b('item-container')} />
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
