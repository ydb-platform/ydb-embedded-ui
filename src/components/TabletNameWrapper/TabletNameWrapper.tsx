import {useTabletPagePath} from '../../routes';
import {cn} from '../../utils/cn';
import {EntityName} from '../EntityName/EntityName';

import './TabletNameWrapper.scss';

const b = cn('ydb-tablet-name-wrapper');

interface TabletNameWrapperProps {
    tabletId: string | number;
    followerId?: string | number;
}

export function TabletNameWrapper({tabletId, followerId}: TabletNameWrapperProps) {
    const getTabletPagePath = useTabletPagePath();
    const tabletPath = getTabletPagePath(tabletId, {followerId: followerId?.toString()});
    const tabletName = `${tabletId}${followerId ? `.${followerId}` : ''}`;

    return <EntityName name={tabletName} path={tabletPath} hasClipboardButton className={b()} />;
}
