import {useState} from 'react';
import {LoadingContainer} from '../../../../../components/LoadingContainer/LoadingContainer';
import {TenantDashboard} from '../TenantDashboard/TenantDashboard';
import {memoryDashboardConfig} from './memoryDashboardConfig';
import {TopNodesByMemory} from './TopNodesByMemory';
import {b} from '../utils';

interface TenantMemoryProps {
    path: string;
}

export function TenantMemory({path}: TenantMemoryProps) {
    const [dashboardLoading, setDashboardLoading] = useState<boolean>(true);

    return (
        <LoadingContainer loading={dashboardLoading} className={b('loading-container')}>
            <TenantDashboard
                charts={memoryDashboardConfig}
                onDashboardLoad={() => setDashboardLoading(false)}
            />
            <TopNodesByMemory path={path} />
        </LoadingContainer>
    );
}
