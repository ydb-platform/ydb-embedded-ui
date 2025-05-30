import {EFlag} from '../../../types/api/enums';
import type {IssueLog} from '../../../types/api/healthcheck';
import {StatusFlag} from '../../../types/api/healthcheck';

import type {IssuesTree} from './types';

export const hcStatusToColorFlag: Record<StatusFlag, EFlag> = {
    [StatusFlag.UNSPECIFIED]: EFlag.Grey,
    [StatusFlag.GREY]: EFlag.Grey,
    [StatusFlag.GREEN]: EFlag.Green,
    [StatusFlag.BLUE]: EFlag.Blue,
    [StatusFlag.YELLOW]: EFlag.Yellow,
    [StatusFlag.ORANGE]: EFlag.Orange,
    [StatusFlag.RED]: EFlag.Red,
};

export function getLeavesFromTree(issues: IssueLog[], root: IssueLog): IssuesTree[] {
    const result: IssuesTree[] = [];

    if (!root.reason || root.reason.length === 0) {
        return [root];
    }

    for (const issueId of root.reason) {
        const directChild: IssuesTree | undefined = issues.find((issue) => issue.id === issueId);
        if (!directChild) {
            continue;
        }
        const stack: IssuesTree[] = [directChild];

        const directChildType = directChild.type;

        while (stack.length > 0) {
            const currentNode = stack.pop()!;

            if (!currentNode.reason || currentNode.reason.length === 0) {
                result.push(currentNode);
                continue;
            }

            for (const reason of currentNode.reason) {
                const child: IssuesTree | undefined = issues.find((issue) => issue.id === reason);
                if (!child) {
                    continue;
                }
                const extendedChild = {...child, parent: currentNode, upperType: directChildType};
                stack.push(extendedChild);
            }
        }
    }

    return result;
}
