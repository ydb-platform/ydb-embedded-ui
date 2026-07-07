import React from 'react';

import {useLocation} from 'react-router-dom';

import {useDiagnosticsPageLinkGetter} from '../../containers/Tenant/Diagnostics/DiagnosticsPages';
import {useNavigationV2Enabled} from '../../containers/Tenant/utils/useNavigationV2Enabled';
import {parseQuery} from '../../routes';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../store/reducers/tenant/constants';
import {InternalLink} from '../InternalLink';

import {getSchemaObjectLinkDiagnosticsTab} from './utils';

interface LinkToSchemaObjectProps extends Omit<React.ComponentProps<typeof InternalLink>, 'to'> {
    path: string;
}

export function LinkToSchemaObject({path, ...props}: LinkToSchemaObjectProps) {
    const location = useLocation();
    const isV2NavigationEnabled = useNavigationV2Enabled();
    const getDiagnosticsPageLink = useDiagnosticsPageLinkGetter();
    const queryParams = parseQuery(location);
    const diagnosticsTab =
        getSchemaObjectLinkDiagnosticsTab(queryParams, isV2NavigationEnabled) ??
        TENANT_DIAGNOSTICS_TABS_IDS.overview;
    const pathToSchemaObject = getDiagnosticsPageLink(diagnosticsTab, {schema: path});

    return <InternalLink view="normal" {...props} to={pathToSchemaObject} />;
}
