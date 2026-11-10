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

export interface TableDataQualityReport extends ResponseDataQuality {
    /** Client time when the response was received */
    receivedAt: number;
    /** Identifies filters and sorting of the request; chunks of one table view share it */
    requestKey: string;
}

export type TableDataWithQuality<T> = PaginatedTableData<T> & {
    dataQuality?: TableDataQualityReport;
};
