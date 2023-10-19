import type {Location} from 'history';

import {Link, type LinkProps} from '@gravity-ui/uikit';

import {parseQuery} from '../../routes';
import {getTenantPath} from '../../containers/Tenant/TenantPages';

interface LinkToSchemaObjectProps extends LinkProps {
    path: string;
    location: Location;
}

export function LinkToSchemaObject({path, location, ...props}: LinkToSchemaObjectProps) {
    const queryParams = parseQuery(location);

    return <Link view="normal" href={getTenantPath({...queryParams, schema: path})} {...props} />;
}
