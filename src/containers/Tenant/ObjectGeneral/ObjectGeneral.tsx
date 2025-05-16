import {useThemeValue} from '@gravity-ui/uikit';

import {TENANT_PAGES_IDS} from '../../../store/reducers/tenant/constants';
import type {AdditionalNodesProps, AdditionalTenantsProps} from '../../../types/additionalProps';
import type {EPathSubType, EPathType} from '../../../types/api/schema';
import {cn} from '../../../utils/cn';
import {useTypedSelector} from '../../../utils/hooks';
import Diagnostics from '../Diagnostics/Diagnostics';
import {Query} from '../Query/Query';
import {TenantNavigation} from '../TenantNavigation/TenantNavigation';

import './ObjectGeneral.scss';

const b = cn('object-general');

interface ObjectGeneralProps {
    type?: EPathType;
    subType?: EPathSubType;
    tenantName: string;
    path: string;
    additionalTenantProps?: AdditionalTenantsProps;
    additionalNodesProps?: AdditionalNodesProps;
}

function ObjectGeneral(props: ObjectGeneralProps) {
    const theme = useThemeValue();

    const {tenantPage} = useTypedSelector((state) => state.tenant);

    const renderPageContent = () => {
        const {type, subType, additionalTenantProps, additionalNodesProps, tenantName, path} =
            props;
        switch (tenantPage) {
            case TENANT_PAGES_IDS.query: {
                return <Query tenantName={tenantName} path={path} theme={theme} type={type} />;
            }
            default: {
                return (
                    <Diagnostics
                        type={type}
                        subType={subType}
                        tenantName={tenantName}
                        path={path}
                        additionalTenantProps={additionalTenantProps}
                        additionalNodesProps={additionalNodesProps}
                    />
                );
            }
        }
    };

    return (
        <div className={b()}>
            <TenantNavigation />
            {renderPageContent()}
        </div>
    );
}

export default ObjectGeneral;
