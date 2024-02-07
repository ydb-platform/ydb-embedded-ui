import {TenantDashboard} from '../TenantDashboard/TenantDashboard';
import {defaultDashboardConfig} from './defaultDashboardConfig';

export const DefaultOverviewContent = () => {
    return <TenantDashboard charts={defaultDashboardConfig} />;
};
