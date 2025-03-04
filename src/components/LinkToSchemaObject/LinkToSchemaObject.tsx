import {Link} from '@gravity-ui/uikit';
import type {LinkProps} from '@gravity-ui/uikit';
import {useLocation} from 'react-router-dom';

import {createExternalUILink, parseQuery} from '../../routes';

interface LinkToSchemaObjectProps extends Omit<LinkProps, 'href'> {
    path: string;
}

export function LinkToSchemaObject({path, ...props}: LinkToSchemaObjectProps) {
    const location = useLocation();
    const queryParams = parseQuery(location);
    const pathToSchemaObject = createExternalUILink({
        ...queryParams,
        schema: path,
    });

    return <Link view="normal" {...props} href={pathToSchemaObject} />;
}
