import {useThemeValue} from '@gravity-ui/uikit';

import {TENANT_PAGES_IDS} from '../../../store/reducers/tenant/constants';
import type {AdditionalTenantsProps} from '../../../types/additionalProps';
import {cn} from '../../../utils/cn';
import {useTypedSelector} from '../../../utils/hooks';
import Diagnostics from '../Diagnostics/Diagnostics';
import {Query} from '../Query/Query';
import {TenantNavigation} from '../TenantNavigation/TenantNavigation';

import './ObjectGeneral.scss';

const b = cn('object-general');

interface ObjectGeneralProps {
    additionalTenantProps?: AdditionalTenantsProps;
}

function ObjectGeneral({additionalTenantProps}: ObjectGeneralProps) {
    const theme = useThemeValue();

    const {tenantPage} = useTypedSelector((state) => state.tenant);

    const renderPageContent = () => {
        switch (tenantPage) {
            case TENANT_PAGES_IDS.query: {
                return <Query theme={theme} />;
            }
            default: {
                return <Diagnostics additionalTenantProps={additionalTenantProps} />;
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
