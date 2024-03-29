import {TenantDashboard} from '../TenantDashboard/TenantDashboard';
import {memoryDashboardConfig} from './memoryDashboardConfig';
import {TopNodesByMemory} from './TopNodesByMemory';

interface TenantMemoryProps {
    path: string;
}

export function TenantMemory({path}: TenantMemoryProps) {
    return (
        <>
            <TenantDashboard database={path} charts={memoryDashboardConfig} />
            <TopNodesByMemory path={path} />
        </>
    );
}
