import {useThemeValue} from '@gravity-ui/uikit';

import {TENANT_PAGES_IDS} from '../../../store/reducers/tenant/constants';
import type {AdditionalNodesProps, AdditionalTenantsProps} from '../../../types/additionalProps';
import type {EPathType} from '../../../types/api/schema';
import {cn} from '../../../utils/cn';
import {useTypedSelector} from '../../../utils/hooks';
import Diagnostics from '../Diagnostics/Diagnostics';
import {Query} from '../Query/Query';
import {TenantNavigation} from '../TenantNavigation/TenantNavigation';

import './ObjectGeneral.scss';

const b = cn('object-general');

interface ObjectGeneralProps {
    type?: EPathType;
    tenantName: string;
    additionalTenantProps?: AdditionalTenantsProps;
    additionalNodesProps?: AdditionalNodesProps;
}

function ObjectGeneral(props: ObjectGeneralProps) {
    const theme = useThemeValue();

    const {tenantPage} = useTypedSelector((state) => state.tenant);

    const renderTabContent = () => {
        const {type, additionalTenantProps, additionalNodesProps, tenantName} = props;
        switch (tenantPage) {
            case TENANT_PAGES_IDS.query: {
                return <Query path={tenantName} theme={theme} type={type} />;
            }
            default: {
                return (
                    <Diagnostics
                        type={type}
                        additionalTenantProps={additionalTenantProps}
                        additionalNodesProps={additionalNodesProps}
                    />
                );
            }
        }
    };

    const renderContent = () => {
        const {tenantName} = props;
        if (!tenantName) {
            return null;
        }
        return (
            <div className={b()}>
                <TenantNavigation />
                {renderTabContent()}
            </div>
        );
    };

    return renderContent();
}

export default ObjectGeneral;
