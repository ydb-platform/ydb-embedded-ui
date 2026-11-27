import type {SortOrder} from '@gravity-ui/react-data-table';

type SortParams = SortOrder | SortOrder[] | undefined;

/**
 * DataTable reports a multi-column sort without the priority of its columns: a column whose
 * direction was just changed comes last. Feeding that back as a controlled `sortOrder`, or
 * sending it to the backend, would reorder the sort, so columns that were already sorted keep
 * their previous places.
 */
export function keepSortPriority(previous: SortParams, next: SortParams): SortParams {
    if (!Array.isArray(next) || !previous) {
        return next;
    }
    const previousColumns = (Array.isArray(previous) ? previous : [previous]).map(
        ({columnId}) => columnId,
    );
    const priority = ({columnId}: SortOrder) => {
        const index = previousColumns.indexOf(columnId);
        return index === -1 ? previousColumns.length : index;
    };
    return next.toSorted((a, b) => priority(a) - priority(b));
}
