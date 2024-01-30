import {useState} from 'react';
import {LoadingContainer} from '../../../../../components/LoadingContainer/LoadingContainer';
import {TenantDashboard} from '../TenantDashboard/TenantDashboard';
import {defaultDashboardConfig} from './defaultDashboardConfig';
import {b} from '../utils';

export const DefaultOverviewContent = () => {
    const [dashboardLoading, setDashboardLoading] = useState<boolean>(true);

    return (
        <LoadingContainer
            loading={dashboardLoading}
            className={b('loading-container')}
            loader={null}
        >
            <TenantDashboard
                charts={defaultDashboardConfig}
                onDashboardLoad={() => setDashboardLoading(false)}
            />
        </LoadingContainer>
    );
};
