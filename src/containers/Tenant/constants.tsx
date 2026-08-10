import {Flex, Text} from '@gravity-ui/uikit';

import {SelfCheckResult} from '../../types/api/healthcheck';

import i18n from './i18n';

export const ROW_COUNT_NOTE = {
    children: (
        <Flex width="528px" direction="column" gap={2}>
            {i18n('context_row-count-accuracy')
                .split('\n')
                .map((paragraph) => (
                    <Text key={paragraph}>{paragraph}</Text>
                ))}
        </Flex>
    ),
    popoverProps: {placement: 'right' as const},
};

export const HEALTHCHECK_RESULT_TO_TEXT: Record<SelfCheckResult, string> = {
    [SelfCheckResult.UNSPECIFIED]: i18n('context_healthcheck-status-unknown'),
    [SelfCheckResult.GOOD]: i18n('context_healthcheck-status-ok'),
    [SelfCheckResult.DEGRADED]: i18n('context_healthcheck-status-degraded'),
    [SelfCheckResult.MAINTENANCE_REQUIRED]: i18n('context_healthcheck-status-maintenance'),
    [SelfCheckResult.EMERGENCY]: i18n('context_healthcheck-status-emergency'),
};
