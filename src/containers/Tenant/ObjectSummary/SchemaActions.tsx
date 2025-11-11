import {Button, Icon} from '@gravity-ui/uikit';

import {
    TENANT_DIAGNOSTICS_TABS_IDS,
    TENANT_PAGES_IDS,
} from '../../../store/reducers/tenant/constants';
import {setDiagnosticsTab} from '../../../store/reducers/tenant/tenant';
import {useTypedDispatch, useTypedSelector} from '../../../utils/hooks';
import {useTenantPage} from '../TenantNavigation/useTenantNavigation';

import i18n from './i18n';

import ArrowRightFromSquareIcon from '@gravity-ui/icons/svgs/arrow-right-from-square.svg';

export function SchemaActions() {
    const dispatch = useTypedDispatch();
    const {diagnosticsTab} = useTypedSelector((state) => state.tenant);

    const {tenantPage, handleTenantPageChange} = useTenantPage();

    const diagnosticsSchemaActive =
        tenantPage === TENANT_PAGES_IDS.diagnostics &&
        diagnosticsTab === TENANT_DIAGNOSTICS_TABS_IDS.schema;

    return (
        <div>
            {!diagnosticsSchemaActive && (
                <Button
                    title={i18n('action_openInDiagnostics')}
                    onClick={() => {
                        handleTenantPageChange(TENANT_PAGES_IDS.diagnostics);
                        dispatch(setDiagnosticsTab(TENANT_DIAGNOSTICS_TABS_IDS.schema));
                    }}
                    size="s"
                >
                    <Icon data={ArrowRightFromSquareIcon} size={14} />
                </Button>
            )}
        </div>
    );
}
