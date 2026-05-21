import React from 'react';

import type {ButtonProps} from '@gravity-ui/uikit';
import {Button} from '@gravity-ui/uikit';
import {useHistory} from 'react-router-dom';

import {getLocationObjectFromHref} from '../../routes';
import {isModifiedClickEvent} from '../../utils/events';

type InternalLinkButtonProps = ButtonProps & {
    href: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

export function InternalLinkButton({href, onClick, target, ...props}: InternalLinkButtonProps) {
    const history = useHistory();
    const linkHref = React.useMemo(
        () => history.createHref(getLocationObjectFromHref(href)),
        [history, href],
    );
    const navigate = React.useCallback((path: string) => history.push(path), [history]);

    const handleClick = React.useCallback<React.MouseEventHandler<HTMLAnchorElement>>(
        (event) => {
            onClick?.(event);

            const shouldHandleInternally =
                !event.defaultPrevented &&
                !isModifiedClickEvent(event) &&
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
