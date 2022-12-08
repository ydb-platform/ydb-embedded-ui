import isEqual from 'lodash/isEqual';
import type {Reducer} from 'redux';

import {tooltipTemplates} from '../../utils/tooltip';

import {
    ITooltipAction,
    ITooltipPositions,
    ITooltipState,
    ITooltipTemplateType,
} from '../../types/store/tooltip';

const HIDE_TOOLTIP = 'tooltip/HIDE_TOOLTIP';
const UPDATE_REF = 'tooltip/UPDATE_REF';

const initialState: ITooltipState = {
    toolTipVisible: false,
    currentHoveredRef: undefined,
    data: undefined,
    templateType: 'pool',
    template: tooltipTemplates['pool'],
};

const tooltip: Reducer<ITooltipState, ITooltipAction> = (state = initialState, action) => {
    switch (action.type) {
        case HIDE_TOOLTIP: {
            return {
                ...state,
                currentHoveredRef: undefined,
                toolTipVisible: false,
            };
        }

        case UPDATE_REF: {
            if (action.templateType === 'cell' && isEqual(action.node, state.currentHoveredRef)) {
                return {
                    ...state,
                    currentHoveredRef: undefined,
                    toolTipVisible: false,
                };
            }

            return {
                ...state,
                toolTipVisible: true,
                currentHoveredRef: action.node,
                positions: action.positions,
                data: action.data,
                additionalData: action.additionalData,
                templateType: action.templateType,
                template: tooltipTemplates[action.templateType],
            };
        }
        default: {
            return state;
        }
    }
};

export const hideTooltip = () => {
    return {type: HIDE_TOOLTIP} as const;
};

export const showTooltip = (
    node: EventTarget,
    data: any,
    templateType: ITooltipTemplateType,
    additionalData?: any,
    positions?: ITooltipPositions,
) => {
    return {
        type: UPDATE_REF,
        node,
        data,
        templateType,
        additionalData,
        positions,
    };
};

export default tooltip;
