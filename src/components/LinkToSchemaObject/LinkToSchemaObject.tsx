import type {Location} from 'history';

import {Link, type LinkProps} from '@gravity-ui/uikit';

import {createExternalUILink, parseQuery} from '../../routes';

interface LinkToSchemaObjectProps extends LinkProps {
    path: string;
    location: Location;
}

export function LinkToSchemaObject({path, location, ...props}: LinkToSchemaObjectProps) {
    const queryParams = parseQuery(location);
    const pathToSchemaObject = createExternalUILink({
        ...queryParams,
        schema: path,
    });

    return <Link view="normal" href={pathToSchemaObject} {...props} />;
}
