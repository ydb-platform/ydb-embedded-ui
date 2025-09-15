import {getTabletPagePath} from '../../routes';
import {EntityStatus} from '../EntityStatus/EntityStatus';

interface TabletNameWrapperProps {
    tabletId: string | number;
    followerId?: string | number;
    database?: string;
}

export function TabletNameWrapper({tabletId, followerId, database}: TabletNameWrapperProps) {
    const tabletPath = getTabletPagePath(tabletId, {database, followerId: followerId?.toString()});
    const tabletName = `${tabletId}${followerId ? `.${followerId}` : ''}`;

    return (
        <EntityStatus name={tabletName} path={tabletPath} hasClipboardButton showStatus={false} />
    );
}
