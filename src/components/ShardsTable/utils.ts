import type {CellValue} from '../../types/api/query';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {formatDateTime} from '../../utils/dataFormatters/dataFormatters';

export function prepareDateTimeValue(value: CellValue) {
    if (!value) {
        return EMPTY_DATA_PLACEHOLDER;
    }
    return formatDateTime(new Date(value).getTime());
}
