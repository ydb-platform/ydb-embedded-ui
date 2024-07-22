import {ArrowUpRightFromSquare} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import './DeveloperUILinkButton.scss';

const b = cn('developer-ui-link-button');

interface DeveloperUiLinkProps {
    className?: string;
    visible?: boolean;
    href: string;
}

export function DeveloperUILinkButton({href, visible = false, className}: DeveloperUiLinkProps) {
    return (
        <Button size="s" href={href} className={b({visible}, className)} target="_blank">
            <Icon data={ArrowUpRightFromSquare} />
        </Button>
    );
}
