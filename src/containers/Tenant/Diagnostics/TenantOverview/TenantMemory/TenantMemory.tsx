import {TopNodesByMemory} from './TopNodesByMemory';

interface TenantMemoryProps {
    path: string;
}

export function TenantMemory({path}: TenantMemoryProps) {
    return <TopNodesByMemory path={path} />;
}
