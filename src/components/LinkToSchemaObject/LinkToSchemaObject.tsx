import {Link} from '@gravity-ui/uikit';
import type {LinkProps} from '@gravity-ui/uikit';
import type {Location} from 'history';

import {createExternalUILink, parseQuery} from '../../routes';

interface LinkToSchemaObjectProps extends Omit<LinkProps, 'href'> {
    path: string;
    location: Location;
}

export function LinkToSchemaObject({path, location, ...props}: LinkToSchemaObjectProps) {
    const queryParams = parseQuery(location);
    const pathToSchemaObject = createExternalUILink({
        ...queryParams,
        schema: path,
    });

    return <Link view="normal" {...props} href={pathToSchemaObject} />;
}
