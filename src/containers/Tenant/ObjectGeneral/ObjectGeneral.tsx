import {useLocation} from 'react-router';
import cn from 'bem-cn-lite';

import {useThemeValue} from '@gravity-ui/uikit';

import type {EPathType} from '../../../types/api/schema';
import type {AdditionalTenantsProps} from '../../../types/additionalProps';
import type {AdditionalNodesInfo} from '../../../utils/nodes';
import {TENANT_PAGES_IDS} from '../../../store/reducers/tenant/constants';
import {useSetting} from '../../../utils/hooks';
import {TENANT_INITIAL_PAGE_KEY} from '../../../utils/constants';
import {parseQuery} from '../../../routes';

import {Query} from '../Query/Query';
import Diagnostics from '../Diagnostics/Diagnostics';

import './ObjectGeneral.scss';

const b = cn('object-general');

interface ObjectGeneralProps {
    type?: EPathType;
    additionalTenantInfo?: AdditionalTenantsProps;
    additionalNodesInfo?: AdditionalNodesInfo;
}

function ObjectGeneral(props: ObjectGeneralProps) {
    const location = useLocation();
    const theme = useThemeValue();

    const [initialPage] = useSetting<string>(TENANT_INITIAL_PAGE_KEY);

    const queryParams = parseQuery(location);
    const {name: tenantName, tenantPage = initialPage} = queryParams;

    const renderTabContent = () => {
        const {type, additionalTenantInfo, additionalNodesInfo} = props;
        switch (tenantPage) {
            case TENANT_PAGES_IDS.query: {
                return <Query path={tenantName as string} theme={theme} type={type} />;
            }
            default: {
                return (
                    <Diagnostics
                        type={type}
                        additionalTenantInfo={additionalTenantInfo}
                        additionalNodesInfo={additionalNodesInfo}
                    />
                );
            }
        }
    };

    const renderContent = () => {
        if (!tenantName) {
            return null;
        }
        return <div className={b()}>{renderTabContent()}</div>;
    };

    return renderContent();
}

export default ObjectGeneral;
