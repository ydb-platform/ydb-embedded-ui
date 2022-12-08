import {hideTooltip, showTooltip} from '../../store/reducers/tooltip';
import {tooltipTemplates} from '../../utils/tooltip';

export type ITooltipTemplateType = keyof typeof tooltipTemplates;

export interface ITooltipPositions {
    left: number;
    top: number;
}

export interface ITooltipState {
    toolTipVisible: boolean;
    positions?: ITooltipPositions;
    currentHoveredRef?: EventTarget;
    template: (data: any) => JSX.Element;
    templateType: ITooltipTemplateType;
    data?: any;
    additionalData?: any;
}

export type ITooltipAction = ReturnType<typeof hideTooltip> | ReturnType<typeof showTooltip>;

export interface ITooltipRootStateSlice {
    tooltip: ITooltipState;
}
