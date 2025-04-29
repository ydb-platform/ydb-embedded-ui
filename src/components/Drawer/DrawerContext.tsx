import React from 'react';

import {cn} from '../../utils/cn';

const b = cn('ydb-drawer');

export interface DrawerContextType {
    containerWidth: number;
    setContainerWidth: React.Dispatch<React.SetStateAction<number>>;
}

const DrawerContext = React.createContext<DrawerContextType>({
    containerWidth: 0,
    setContainerWidth: () => {},
});

interface DrawerContextProviderProps {
    children: React.ReactNode;
    className?: string;
}

export const DrawerContextProvider = ({children, className}: DrawerContextProviderProps) => {
    const [containerWidth, setContainerWidth] = React.useState(0);
    const containerRef = React.useRef<HTMLDivElement>(null);

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
        }),
        [containerWidth],
    );

    return (
        <DrawerContext.Provider value={value}>
            <div ref={containerRef} className={b('drawer-container', className)}>
                {children}
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
