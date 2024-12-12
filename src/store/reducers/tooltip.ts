import type {Reducer} from '@reduxjs/toolkit';
import isEqual from 'lodash/isEqual';

import type {
    ITooltipAction,
    ITooltipPositions,
    ITooltipState,
    ITooltipTemplateType,
} from '../../types/store/tooltip';

const HIDE_TOOLTIP = 'tooltip/HIDE_TOOLTIP';
export const UPDATE_REF = 'tooltip/UPDATE_REF';

const initialState: ITooltipState = {
    toolTipVisible: false,
    currentHoveredRef: undefined,
    data: undefined,
    templateType: 'cell',
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
    node: EventTarget | null,
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
