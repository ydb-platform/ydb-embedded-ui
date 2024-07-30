import type {SimplifiedPlanItem} from '../../../../../../store/reducers/explainQuery/types';

export interface ExtendedSimplifiesPlanItem extends SimplifiedPlanItem {
    lines?: string;
}
