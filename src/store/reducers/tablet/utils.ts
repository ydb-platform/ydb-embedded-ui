import type {TDomainKey, THiveInfoResponse} from '../../../types/api/tablet';

export function getTabletObjectKey(
    hiveInfo: THiveInfoResponse,
    tabletId: string,
): TDomainKey | undefined {
    const tablet = hiveInfo.Tablets?.find(({TabletID}) => TabletID === tabletId);
    const schemeShard = tablet?.TabletOwner?.Owner;
    const pathId = tablet?.ObjectId;

    if (!schemeShard || !pathId || pathId === '0') {
        return undefined;
    }

    return {SchemeShard: schemeShard, PathId: pathId};
}
