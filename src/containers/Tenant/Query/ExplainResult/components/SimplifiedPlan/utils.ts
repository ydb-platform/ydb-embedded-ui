import type {SimplifiedPlanItem} from '../../../../../../store/reducers/query/types';
import {cn} from '../../../../../../utils/cn';

import type {ExtendedSimplifiesPlanItem} from './types';

export const block = cn('ydb-query-explain-simplified-plan');

export function getExtendedTreeNodes(
    items?: SimplifiedPlanItem[],
    prefix = '',
): ExtendedSimplifiesPlanItem[] {
    if (!items) {
        return [];
    }

    const stack: {
        items: SimplifiedPlanItem[];
        prefix: string;
        parentIndex: number;
        parentArray: ExtendedSimplifiesPlanItem[];
    }[] = [{items, prefix, parentIndex: -1, parentArray: []}];

    const newItems: ExtendedSimplifiesPlanItem[] = [];

    while (stack.length > 0) {
        const {items, prefix, parentIndex, parentArray} = stack.pop()!;
        const localItems: ExtendedSimplifiesPlanItem[] = [];

        for (let i = 0; i < items.length; i++) {
            const newItem: ExtendedSimplifiesPlanItem = {...items[i]};
            const line = i < items.length - 1 ? 1 : 0;
            let newPrefix = `${prefix}.${line}`;

            if (!prefix) {
                newPrefix = String(line);
            }
            newItem['lines'] = newPrefix;

            localItems.push(newItem);

            if (newItem.children) {
                stack.push({
                    items: newItem.children,
                    prefix: newPrefix,
                    parentIndex: i,
                    parentArray: localItems,
                });
            }
        }

        if (parentIndex === -1) {
            newItems.push(...localItems);
        } else {
            parentArray[parentIndex].children = localItems;
        }
    }

    return newItems;
}
