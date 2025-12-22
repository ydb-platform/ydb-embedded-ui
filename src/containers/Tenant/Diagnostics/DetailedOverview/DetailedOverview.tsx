import type {AdditionalTenantsProps} from '../../../../types/additionalProps';
import type {EPathType} from '../../../../types/api/schema';
import {cn} from '../../../../utils/cn';
import Overview from '../Overview/Overview';
import {TenantOverview} from '../TenantOverview/TenantOverview';

import './DetailedOverview.scss';

interface DetailedOverviewProps {
    type?: EPathType;
    className?: string;
    database: string;
    path: string;
    databaseFullPath: string;
    additionalTenantProps?: AdditionalTenantsProps;
}

const b = cn('kv-detailed-overview');

function DetailedOverview({
    type,
    database,
    databaseFullPath,
    path,
    additionalTenantProps,
}: DetailedOverviewProps) {
    const renderTenantOverview = () => {
        return (
            <div className={b('section')}>
                <TenantOverview
                    database={database}
                    databaseFullPath={databaseFullPath}
                    additionalTenantProps={additionalTenantProps}
                />
            </div>
        );
    };

    const isTenant = databaseFullPath === path;

    return (
        <div className={b()}>
            {isTenant ? (
                renderTenantOverview()
            ) : (
                <Overview
                    type={type}
                    path={path}
                    database={database}
                    databaseFullPath={databaseFullPath}
                />
            )}
        </div>
    );
}

export default DetailedOverview;
