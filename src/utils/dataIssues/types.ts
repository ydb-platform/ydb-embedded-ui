import type {PaginatedTableData} from '../../components/PaginatedTable/types';

/**
 * What the viewer handler reported about the response it returned:
 * `Problems` lists data sources that failed, `Need*` flags stay raised
 * when the handler could not apply the requested filter, sorting or grouping.
 */
export interface ResponseDataQuality {
    problems: string[];
    needFilter: boolean;
    needSort: boolean;
    needGroup: boolean;
}

/** A chunk of a paginated table together with what the handler reported about its response */
export type TableDataWithQuality<T> = PaginatedTableData<T> & {
    dataQuality?: ResponseDataQuality;
};
