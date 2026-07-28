import React from 'react';

import {useLocation} from 'react-router-dom';

import {useDiagnosticsPageLinkGetter} from '../../containers/Tenant/Diagnostics/DiagnosticsPages';
import {useOptionalDispatchTreeKey} from '../../containers/Tenant/ObjectSummary/UpdateTreeContext';
import {useNavigationV2Enabled} from '../../containers/Tenant/utils/useNavigationV2Enabled';
import {parseQuery} from '../../routes';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../store/reducers/tenant/constants';
import {InternalLink} from '../InternalLink';

import {getSchemaObjectLinkDiagnosticsTab} from './utils';

interface LinkToSchemaObjectProps extends Omit<React.ComponentProps<typeof InternalLink>, 'to'> {
    path: string;
}

function shouldRefreshSchemaTree(
    event: React.MouseEvent<HTMLAnchorElement>,
    target: LinkToSchemaObjectProps['target'],
) {
    return (
        !event.defaultPrevented &&
        event.button === 0 &&
        !event.metaKey &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        (!target || target === '_self')
    );
}

export function LinkToSchemaObject({path, onClick, target, ...props}: LinkToSchemaObjectProps) {
    const location = useLocation();
    const isV2NavigationEnabled = useNavigationV2Enabled();
    const getDiagnosticsPageLink = useDiagnosticsPageLinkGetter();
    const refreshSchemaTree = useOptionalDispatchTreeKey();
    const queryParams = parseQuery(location);
    const diagnosticsTab =
        getSchemaObjectLinkDiagnosticsTab(queryParams, isV2NavigationEnabled) ??
        TENANT_DIAGNOSTICS_TABS_IDS.overview;
    const pathToSchemaObject = getDiagnosticsPageLink(diagnosticsTab, {schema: path});

    const handleClick = React.useCallback(
        (event: React.MouseEvent<HTMLAnchorElement>) => {
            onClick?.(event);

            if (refreshSchemaTree && shouldRefreshSchemaTree(event, target)) {
                refreshSchemaTree(path);
            }
        },
        [onClick, path, refreshSchemaTree, target],
    );

    return (
        <InternalLink
            view="normal"
            {...props}
            target={target}
            onClick={handleClick}
            to={pathToSchemaObject}
        />
    );
}
