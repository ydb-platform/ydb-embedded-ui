import {getPDiskPagePath} from '../../routes';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';

import {i18n} from './i18n';

interface PDiskPageLinkProps {
    pDiskId: string | number;
    nodeId: string | number;
}

/**
 * @deprecated Use direct links to the PDisk page instead.
 */
export function PDiskPageLink({pDiskId: PDiskId, nodeId}: PDiskPageLinkProps) {
    return (
        <LinkWithIcon
            title={i18n('pdisk-page')}
            url={getPDiskPagePath(PDiskId, nodeId)}
            external={false}
        />
    );
}
