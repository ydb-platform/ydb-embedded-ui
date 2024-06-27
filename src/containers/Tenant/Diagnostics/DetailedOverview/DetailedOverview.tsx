import type {AdditionalNodesProps, AdditionalTenantsProps} from '../../../../types/additionalProps';
import type {EPathType} from '../../../../types/api/schema';
import {cn} from '../../../../utils/cn';
import Overview from '../Overview/Overview';
import {TenantOverview} from '../TenantOverview/TenantOverview';

import './DetailedOverview.scss';

interface DetailedOverviewProps {
    type?: EPathType;
    className?: string;
    tenantName: string;
    path: string;
    additionalTenantProps?: AdditionalTenantsProps;
    additionalNodesProps?: AdditionalNodesProps;
}

const b = cn('kv-detailed-overview');

function DetailedOverview(props: DetailedOverviewProps) {
    const {type, tenantName, path, additionalTenantProps, additionalNodesProps} = props;

    const renderTenantOverview = () => {
        return (
            <div className={b('section')}>
                <TenantOverview
                    tenantName={tenantName}
                    additionalTenantProps={additionalTenantProps}
                    additionalNodesProps={additionalNodesProps}
                />
            </div>
        );
    };

    const isTenant = tenantName === path;

    return (
        <div className={b()}>
            {isTenant ? renderTenantOverview() : <Overview type={type} path={path} />}
        </div>
    );
}

export default DetailedOverview;
