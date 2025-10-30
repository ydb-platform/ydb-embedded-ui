import {useTabletPagePath} from '../../routes';
import {EntityStatus} from '../EntityStatus/EntityStatus';

interface TabletNameWrapperProps {
    tabletId: string | number;
    followerId?: string | number;
}

export function TabletNameWrapper({tabletId, followerId}: TabletNameWrapperProps) {
    const getTabletPagePath = useTabletPagePath();
    const tabletPath = getTabletPagePath(tabletId, {followerId: followerId?.toString()});
    const tabletName = `${tabletId}${followerId ? `.${followerId}` : ''}`;

    return (
        <EntityStatus name={tabletName} path={tabletPath} hasClipboardButton showStatus={false} />
    );
}
