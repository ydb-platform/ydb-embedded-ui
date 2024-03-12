import {TenantDashboard} from '../TenantDashboard/TenantDashboard';
import {defaultDashboardConfig} from './defaultDashboardConfig';

interface DefaultOverviewContentProps {
    database: string;
}

export const DefaultOverviewContent = ({database}: DefaultOverviewContentProps) => {
    return <TenantDashboard database={database} charts={defaultDashboardConfig} />;
};
