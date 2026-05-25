import {
    CircleCheckFill,
    CircleInfoFill,
    CircleQuestionFill,
    CircleXmarkFill,
    TriangleExclamationFill,
} from '@gravity-ui/icons';
import {Flex, Text} from '@gravity-ui/uikit';
import type {IconData} from '@gravity-ui/uikit';

import {SelfCheckResult} from '../../types/api/healthcheck';

import i18n from './i18n';

export const ROW_COUNT_NOTE = {
    children: (
        <Flex width="500px">
            <Text whiteSpace="break-spaces">{i18n('note_row-count')}</Text>
        </Flex>
    ),
    popoverProps: {placement: 'right' as const},
};

export const HEALTHCHECK_RESULT_TO_TEXT: Record<SelfCheckResult, string> = {
    [SelfCheckResult.UNSPECIFIED]: '',
    [SelfCheckResult.GOOD]: i18n('description_ok'),
    [SelfCheckResult.DEGRADED]: i18n('description_degraded'),
    [SelfCheckResult.MAINTENANCE_REQUIRED]: i18n('description_maintenance'),
    [SelfCheckResult.EMERGENCY]: i18n('description_emergency'),
};

export const HEALTHCHECK_RESULT_TO_ICON: Record<SelfCheckResult, IconData> = {
    [SelfCheckResult.UNSPECIFIED]: CircleQuestionFill,
    [SelfCheckResult.GOOD]: CircleCheckFill,
    [SelfCheckResult.DEGRADED]: CircleInfoFill,
    [SelfCheckResult.MAINTENANCE_REQUIRED]: CircleXmarkFill,
    [SelfCheckResult.EMERGENCY]: TriangleExclamationFill,
};
