import qs from 'qs';
import {useLocation} from 'react-router';
import cn from 'bem-cn-lite';

import {useThemeValue} from '@gravity-ui/uikit';

import type {EPathType} from '../../../types/api/schema';

import QueryEditor from '../QueryEditor/QueryEditor';
import Diagnostics from '../Diagnostics/Diagnostics';

import {TenantGeneralTabsIds} from '../TenantPages';

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

    const queryParams = qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });

    const {name: tenantName, general: generalTab} = queryParams;

    const renderTabContent = () => {
        const {type, additionalTenantInfo, additionalNodesInfo} = props;
        switch (generalTab) {
            case TenantGeneralTabsIds.query: {
                return <QueryEditor path={tenantName as string} theme={theme} type={type} />;
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
