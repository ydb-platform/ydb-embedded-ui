import type {hideTooltip, showTooltip} from '../../store/reducers/tooltip';
import type {tooltipTemplates} from '../../utils/tooltip';

export type ITooltipTemplateType = keyof typeof tooltipTemplates;

export interface ITooltipPositions {
    left: number;
    top: number;
}

export interface ITooltipState {
    toolTipVisible: boolean;
    positions?: ITooltipPositions;
    currentHoveredRef?: EventTarget | null;
    templateType: ITooltipTemplateType;
    data?: any;
    additionalData?: any;
}

type ShowTooltipFunction = typeof showTooltip;

export type ITooltipAction = ReturnType<typeof hideTooltip> | ReturnType<ShowTooltipFunction>;
