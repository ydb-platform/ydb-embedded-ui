import {MemoryDashboard} from './MemoryDashboard';
import {TopNodesByMemory} from './TopNodesByMemory';

interface TenantMemoryProps {
    path: string;
}

export function TenantMemory({path}: TenantMemoryProps) {
    return (
        <>
            <MemoryDashboard />
            <TopNodesByMemory path={path} />
        </>
    );
}
