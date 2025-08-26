import type {ExplainPlanNodeData} from '@gravity-ui/paranoid';

type Props = {
    width: number;
    height: number;
};

type SizeConfig = Record<ExplainPlanNodeData['type'], Props>;

export const graphSizesConfig: SizeConfig = {
    query: {
        width: 40,
        height: 40,
    },
    result: {
        width: 112,
        height: 40,
    },
    stage: {
        width: 248,
        height: 40,
    },
    connection: {
        width: 112,
        height: 40,
    },
    materialize: {
        width: 190,
        height: 40,
    },
};
