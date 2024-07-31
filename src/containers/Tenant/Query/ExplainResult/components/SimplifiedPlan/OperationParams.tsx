import type {SimlifiedPlanOperatorOtherParams} from '../../../../../../types/api/query';

import {block} from './utils';

const operatorPropertyToColor: Record<string, string> = {
    Table: 'var(--g-color-text-info)',
    Predicate: 'var(--g-color-text-positive)',
    Condition: 'var(--g-color-text-utility)',
};

function getOperatorPropertyColor(property: string) {
    if (property in operatorPropertyToColor) {
        return operatorPropertyToColor[property];
    }
    return 'var(--g-color-text-secondary)';
}

function prepareValue(value: unknown) {
    if (value === undefined) {
        return '';
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    } else {
        return value.toString();
    }
}

function reorderParamsEntries(params: Record<string, unknown>) {
    const reordered: [string, unknown][] = [];
    const {Table, Predicate, Condition, ...rest} = params;
    if (Table) {
        reordered.push(['Table', Table]);
    }
    if (Predicate) {
        reordered.push(['Predicate', Predicate]);
    }
    if (Condition) {
        reordered.push(['Condition', Condition]);
    }
    return reordered.concat(Object.entries(rest));
}

function getOperationParams(params: Record<string, unknown> = {}) {
    const result = [];
    const paramsEntries = Object.entries(params);
    if (paramsEntries.length === 1) {
        const value = paramsEntries[0][1];
        const color = getOperatorPropertyColor(paramsEntries[0][0]);
        result.push(<span style={{color}}>{prepareValue(value)}</span>);
    } else {
        const reorderedParamsEntries = reorderParamsEntries(params);
        for (let i = 0; i < reorderedParamsEntries.length; i++) {
            const [key, value] = reorderedParamsEntries[i];
            const color = getOperatorPropertyColor(key);
            if (i > 0) {
                result.push(<span>, </span>);
            }
            result.push(
                <span style={{color}}>
                    {key}: {prepareValue(value)}
                </span>,
            );
        }
    }

    return result;
}

interface OperationParamsProps {
    params?: SimlifiedPlanOperatorOtherParams;
}

export function OperationParams({params}: OperationParamsProps) {
    if (!params) {
        return null;
    }
    return <span className={block('operation-params')}>({getOperationParams(params)})</span>;
}
