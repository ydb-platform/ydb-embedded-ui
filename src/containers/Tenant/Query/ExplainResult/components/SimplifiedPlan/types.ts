import type {SimplifiedPlanItem} from '../../../../../../store/reducers/query/explainQueryTypes';

export interface ExtendedSimplifiesPlanItem extends Omit<SimplifiedPlanItem, 'children'> {
    lines?: string;
    children?: ExtendedSimplifiesPlanItem[];
}
