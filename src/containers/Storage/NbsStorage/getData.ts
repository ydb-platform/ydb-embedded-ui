import type {FetchData} from '../../../components/PaginatedTable';
import type {NbsDisk, NbsListParams, NbsTablet} from '../../../types/api/nbs';

export type NbsRow = NbsTablet | NbsDisk;
export interface NbsFilters extends NbsListParams {
    disks: boolean;
}

export const getNbsStorage: FetchData<NbsRow, NbsFilters> = async ({
    limit,
    offset,
    filters,
    signal,
}) => {
    const {disks = false, ...params} = filters ?? {};
    const response = await window.api.storage.getNbsStorage(
        disks ? 'disks' : 'tablets',
        {
            ...params,
            ...(disks ? {include_tablet_ids: false} : {}),
            limit,
            offset,
        },
        {signal},
    );
    return {
        data: (disks ? response.Disks : response.Tablets) ?? [],
        total: response.TotalCount ?? 0,
        found: response.TotalCount ?? 0,
    };
};

export function formatUsage(value?: number) {
    return value === undefined || !Number.isFinite(value) || value < 0
        ? undefined
        : `${(value * 100).toFixed(1)}%`;
}
