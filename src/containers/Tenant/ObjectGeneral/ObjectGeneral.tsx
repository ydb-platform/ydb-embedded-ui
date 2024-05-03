import {useThemeValue} from '@gravity-ui/uikit';
import {useLocation} from 'react-router';

import {parseQuery} from '../../../routes';
import {TENANT_PAGES_IDS} from '../../../store/reducers/tenant/constants';
import type {AdditionalNodesProps, AdditionalTenantsProps} from '../../../types/additionalProps';
import type {EPathType} from '../../../types/api/schema';
import {cn} from '../../../utils/cn';
import {TENANT_INITIAL_PAGE_KEY} from '../../../utils/constants';
import {useSetting} from '../../../utils/hooks';
import Diagnostics from '../Diagnostics/Diagnostics';
import {Query} from '../Query/Query';

import './ObjectGeneral.scss';

const b = cn('object-general');

interface ObjectGeneralProps {
    type?: EPathType;
    tenantName: string;
    additionalTenantProps?: AdditionalTenantsProps;
    additionalNodesProps?: AdditionalNodesProps;
}

function ObjectGeneral(props: ObjectGeneralProps) {
    const location = useLocation();
    const theme = useThemeValue();

    const [initialPage] = useSetting<string>(TENANT_INITIAL_PAGE_KEY);

    const queryParams = parseQuery(location);
    const {tenantPage = initialPage} = queryParams;

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
        return <div className={b()}>{renderTabContent()}</div>;
    };

    return renderContent();
}

export default ObjectGeneral;
