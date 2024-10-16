import {ArrowUpRightFromSquare} from '@gravity-ui/icons';
import type {ButtonSize} from '@gravity-ui/uikit';
import {Button, Icon} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import i18n from './i18n';

import './DeveloperUILinkButton.scss';

const b = cn('developer-ui-link-button');

const buttonSizeToIconSize: Record<ButtonSize, number> = {
    xs: 14,
    s: 16,
    m: 16,
    l: 18,
    xl: 18,
};

interface DeveloperUiLinkProps {
    className?: string;
    visible?: boolean;
    href: string;
    size?: ButtonSize;
}

export function DeveloperUILinkButton({
    href,
    visible = false,
    className,
    size = 's',
}: DeveloperUiLinkProps) {
    return (
        <Button
            size={size}
            href={href}
            className={b({visible}, className)}
            target="_blank"
            title={i18n('action_go-to', {href})}
        >
            <Icon data={ArrowUpRightFromSquare} size={buttonSizeToIconSize[size]} />
        </Button>
    );
}
