import {useLocation} from 'react-router';
import cn from 'bem-cn-lite';

import {useThemeValue} from '@gravity-ui/uikit';

import type {EPathType} from '../../../types/api/schema';
import {TENANT_GENERAL_TABS_IDS} from '../../../store/reducers/tenant/constants';
import {useSetting} from '../../../utils/hooks';
import {TENANT_INITIAL_TAB_KEY} from '../../../utils/constants';
import {parseQuery} from '../../../routes';

import {Query} from '../Query/Query';
import Diagnostics from '../Diagnostics/Diagnostics';

import './ObjectGeneral.scss';

const b = cn('object-general');

interface ObjectGeneralProps {
    type?: EPathType;
    additionalTenantInfo?: any;
    additionalNodesInfo?: any;
}

function ObjectGeneral(props: ObjectGeneralProps) {
    const location = useLocation();
    const theme = useThemeValue();

    const [initialTab] = useSetting<string>(TENANT_INITIAL_TAB_KEY, TENANT_GENERAL_TABS_IDS.query);

    const queryParams = parseQuery(location);
    const {name: tenantName, general: generalTab = initialTab} = queryParams;

    const renderTabContent = () => {
        const {type, additionalTenantInfo, additionalNodesInfo} = props;
        switch (generalTab) {
            case TENANT_GENERAL_TABS_IDS.query: {
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
