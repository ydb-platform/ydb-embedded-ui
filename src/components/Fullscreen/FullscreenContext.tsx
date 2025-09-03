import React from 'react';

const FullscreenContext = React.createContext<React.RefObject<HTMLDivElement> | null>(null);

export function useFullscreenContext() {
    const context = React.useContext(FullscreenContext);
    if (!context) {
        throw new Error('useFullscreenContext must be used within a FullscreenProvider');
    }
    return context;
}

export function FullscreenProvider({
    children,
    fullscreenRootRef,
}: {
    children: React.ReactNode;
    fullscreenRootRef: React.RefObject<HTMLDivElement>;
}) {
    return (
        <FullscreenContext.Provider value={fullscreenRootRef}>
            {children}
        </FullscreenContext.Provider>
    );
}
