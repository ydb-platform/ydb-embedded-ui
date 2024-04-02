import React from 'react';

import {useTypedSelector} from '../../lib';

export interface ClusterModeGuardProps {
    children: React.ReactNode;
    mode: 'single' | 'multi';
}

export function ClusterModeGuard({children, mode}: ClusterModeGuardProps) {
    const shouldRender = useTypedSelector((state) =>
        mode === 'single' ? state.singleClusterMode : !state.singleClusterMode,
    );

    return shouldRender ? <React.Fragment>{children}</React.Fragment> : null;
}
