import React from 'react';

import type {ButtonProps} from '@gravity-ui/uikit';
import {Button} from '@gravity-ui/uikit';
import {useHistory} from 'react-router-dom';

type InternalButtonLinkProps = ButtonProps & {
    href: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

export function InternalButtonLink({href, onClick, ...props}: InternalButtonLinkProps) {
    const history = useHistory();
    const navigate = React.useCallback((path: string) => history.push(path), [history]);

    const handleClick = React.useCallback<React.MouseEventHandler<HTMLAnchorElement>>(
        (event) => {
            onClick?.(event);

            if (event.defaultPrevented) {
                return;
            }

            event.preventDefault();
            navigate(href);
        },
        [href, navigate, onClick],
    );

    return <Button {...props} href={href} onClick={handleClick} />;
}
