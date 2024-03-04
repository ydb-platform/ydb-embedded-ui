import {ReactNode, FC, ReactElement} from 'react';
import {useTypedSelector} from '../../utils/hooks';

export interface ClusterModeGuardProps {
    children: ReactNode;
    mode: 'single' | 'multi';
}

export const ClusterModeGuard: FC<ClusterModeGuardProps> = ({children, mode}) =>
    useTypedSelector((state) =>
        mode === 'single' ? state.singleClusterMode : !state.singleClusterMode,
    )
        ? (children as ReactElement)
        : null;
