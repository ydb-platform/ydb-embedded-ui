import type {IssueLog} from '../../../types/api/healthcheck';

export interface IssuesTree extends IssueLog {
    reasonsItems?: IssuesTree[];
    parent?: IssuesTree;
    upperType?: string;
}
