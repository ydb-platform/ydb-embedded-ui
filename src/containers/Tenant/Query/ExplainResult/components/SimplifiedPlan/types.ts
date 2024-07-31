import type {SimplifiedPlanItem} from '../../../../../../store/reducers/explainQuery/types';

export interface ExtendedSimplifiesPlanItem extends Omit<SimplifiedPlanItem, 'children'> {
    lines?: string;
    children?: ExtendedSimplifiesPlanItem[];
}
