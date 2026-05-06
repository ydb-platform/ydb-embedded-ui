import React from 'react';

import type {ButtonProps} from '@gravity-ui/uikit';
import {Button} from '@gravity-ui/uikit';
import {useHistory} from 'react-router-dom';

import {getLocationObjectFromHref} from '../../routes';

type InternalButtonLinkProps = ButtonProps & {
    href: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

export function InternalButtonLink({href, onClick, target, ...props}: InternalButtonLinkProps) {
    const history = useHistory();
    const linkHref = React.useMemo(
        () => history.createHref(getLocationObjectFromHref(href)),
        [history, href],
    );
    const navigate = React.useCallback((path: string) => history.push(path), [history]);

    const handleClick = React.useCallback<React.MouseEventHandler<HTMLAnchorElement>>(
        (event) => {
            onClick?.(event);

            const isModifiedEvent =
                event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
            const shouldHandleInternally =
                !event.defaultPrevented &&
                event.button === 0 &&
                !isModifiedEvent &&
                (!target || target === '_self');

            if (!shouldHandleInternally) {
                return;
            }

            event.preventDefault();
            navigate(href);
        },
        [href, navigate, onClick, target],
    );

    return <Button {...props} href={linkHref} target={target} onClick={handleClick} />;
}
