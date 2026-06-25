import {useThemeValue} from '@gravity-ui/uikit';

import {PageError} from '../../../components/Errors/PageError/PageError';
import {TENANT_PAGES_IDS} from '../../../store/reducers/tenant/constants';
import type {AdditionalTenantsProps} from '../../../types/additionalProps';
import type {EPathSubType, EPathType} from '../../../types/api/schema';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {cn} from '../../../utils/cn';
import Diagnostics from '../Diagnostics/Diagnostics';
import {Query} from '../Query/Query';
import {useCurrentSchema} from '../TenantContext';
import {TenantNavigation} from '../TenantNavigation/TenantNavigation';
import {useTenantPage} from '../TenantNavigation/useTenantNavigation';
import {useNavigationV2Enabled} from '../utils/useNavigationV2Enabled';

import './ObjectGeneral.scss';

const b = cn('object-general');

interface ObjectGeneralProps {
    additionalTenantProps?: AdditionalTenantsProps;
    type: EPathType | undefined;
    subType: EPathSubType | undefined;
    diagnosticsAccessError?: unknown;
}

function ObjectGeneral({
    type,
    subType,
    additionalTenantProps,
    diagnosticsAccessError,
}: ObjectGeneralProps) {
    const theme = useThemeValue();
    const isV2Enabled = useNavigationV2Enabled();
    const {path, database, databaseFullPath} = useCurrentSchema();

    const {tenantPage} = useTenantPage();

    const renderPageContent = () => {
        switch (tenantPage) {
            case TENANT_PAGES_IDS.query: {
                return <Query theme={theme} type={type} subType={subType} />;
            }
            case TENANT_PAGES_IDS.database:
            case TENANT_PAGES_IDS.diagnostics:
            default: {
                if (diagnosticsAccessError) {
                    return (
                        <PageError
                            error={diagnosticsAccessError}
                            {...uiFactory.clusterOrDatabaseAccessError}
                            size="l"
                            illustrationSize="m"
                        />
                    );
                }
                return (
                    <Diagnostics
                        path={path}
                        database={database}
                        type={type}
                        subType={subType}
                        databaseFullPath={databaseFullPath}
                        additionalTenantProps={additionalTenantProps}
                        databasePagesDisplay={isV2Enabled ? 'diagnostics' : 'all'}
                    />
                );
            }
        }
    };

    return (
        <div className={b()}>
            {!isV2Enabled && <TenantNavigation />}
            {renderPageContent()}
        </div>
    );
}

export default ObjectGeneral;
