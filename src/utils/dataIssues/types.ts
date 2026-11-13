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

/** Metadata of a table chunk: what the handler reported about the response the chunk is made of */
export interface DataQualityMeta {
    dataQuality: ResponseDataQuality;
}

/** A chunk of a paginated table whose fetcher tells about the quality of the response */
export type TableDataWithQuality<T> = PaginatedTableData<T, DataQualityMeta>;
