import {useSelector} from 'react-redux';
import cn from 'bem-cn-lite';

import type {EPathType} from '../../../../types/api/schema';
import type {AdditionalNodesProps, AdditionalTenantsProps} from '../../../../types/additionalProps';
import Overview from '../Overview/Overview';
import {TenantOverview} from '../TenantOverview/TenantOverview';

import './DetailedOverview.scss';

interface DetailedOverviewProps {
    type?: EPathType;
    className?: string;
    tenantName: string;
    additionalTenantProps?: AdditionalTenantsProps;
    additionalNodesProps?: AdditionalNodesProps;
}

const b = cn('kv-detailed-overview');

function DetailedOverview(props: DetailedOverviewProps) {
    const {type, tenantName, additionalTenantProps, additionalNodesProps} = props;

    const {currentSchemaPath} = useSelector((state: any) => state.schema);

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

    const isTenant = tenantName === currentSchemaPath;

    return (
        <div className={b()}>
            {isTenant ? renderTenantOverview() : <Overview type={type} tenantName={tenantName} />}
        </div>
    );
}

export default DetailedOverview;
