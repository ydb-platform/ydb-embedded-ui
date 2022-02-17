import {toolTipConstants} from '../../utils/actionsConstants';
import {tooltipTemplates} from '../../utils/tooltip';
import _ from 'lodash';

const initialState = {
    toolTipVisible: false,
    currentHoveredRef: undefined,
    data: undefined,
    templateType: 'pool',
    template: tooltipTemplates['pool'],
};

const tooltip = (state = initialState, action) => {
    switch (action.type) {
        case toolTipConstants.HIDE_TOOLTIP: {
            return {
                ...state,
                currentHoveredRef: undefined,
                toolTipVisible: false,
            };
        }

        case toolTipConstants.UPDATE_REF: {
            if (action.templateType === 'cell' && _.isEqual(action.node, state.currentHoveredRef)) {
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
                type: action.templateType,
                template: tooltipTemplates[action.templateType],
            };
        }
        default: {
            return state;
        }
    }
};

export const hideTooltip = () => {
    return {type: toolTipConstants.HIDE_TOOLTIP};
};

export const showTooltip = (node, data, templateType, additionalData, positions) => {
    return {
        type: toolTipConstants.UPDATE_REF,
        node,
        data,
        templateType,
        additionalData,
        positions,
    };
};

export default tooltip;
