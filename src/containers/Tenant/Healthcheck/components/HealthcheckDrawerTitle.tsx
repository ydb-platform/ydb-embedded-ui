import React from 'react';

import {Flex, Text} from '@gravity-ui/uikit';

import type {SelfCheckResult} from '../../../../types/api/healthcheck';
import {HEALTHCHECK_RESULT_TO_TEXT} from '../../constants';

const STATUS_ROW_STYLE: React.CSSProperties = {
    minHeight: 'var(--g-text-body-1-line-height)',
};

interface HealthcheckDrawerTitleProps {
    title: React.ReactNode;
    status?: SelfCheckResult;
}

export function HealthcheckDrawerTitle({title, status}: HealthcheckDrawerTitleProps) {
    return (
        <Flex as="span" direction="column">
            <Text as="span" variant="subheader-2">
                {title}
            </Text>
            <Text as="span" color="secondary" style={STATUS_ROW_STYLE}>
                {status ? HEALTHCHECK_RESULT_TO_TEXT[status] : null}
            </Text>
        </Flex>
    );
}
