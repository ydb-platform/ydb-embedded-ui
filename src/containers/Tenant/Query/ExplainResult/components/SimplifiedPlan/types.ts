import type {SimplifiedPlanItem} from '../../../../../../store/reducers/query/types';

export interface ExtendedSimplifiesPlanItem extends Omit<SimplifiedPlanItem, 'children'> {
    lines?: string;
    children?: ExtendedSimplifiesPlanItem[];
}
