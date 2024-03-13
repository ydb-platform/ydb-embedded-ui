import {EFlag} from '../../../types/api/enums';
import {StatusFlag} from '../../../types/api/healthcheck';

export const hcStatusToColorFlag: Record<StatusFlag, EFlag> = {
    [StatusFlag.UNSPECIFIED]: EFlag.Grey,
    [StatusFlag.GREY]: EFlag.Grey,
    [StatusFlag.GREEN]: EFlag.Green,
    [StatusFlag.BLUE]: EFlag.Blue,
    [StatusFlag.YELLOW]: EFlag.Yellow,
    [StatusFlag.ORANGE]: EFlag.Orange,
    [StatusFlag.RED]: EFlag.Red,
};
