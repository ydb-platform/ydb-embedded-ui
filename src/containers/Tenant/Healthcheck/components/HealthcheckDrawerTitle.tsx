import React from 'react';

import {Flex, Text} from '@gravity-ui/uikit';

import {EntityStatus} from '../../../../components/EntityStatus/EntityStatus';
import {EFlag} from '../../../../types/api/enums';
import type {SelfCheckResult} from '../../../../types/api/healthcheck';
import {isEnumMember} from '../../../../utils/typecheckers';
import {HEALTHCHECK_RESULT_TO_TEXT} from '../../constants';
import i18n from '../i18n';

const STATUS_ROW_STYLE: React.CSSProperties = {
    minHeight: 'var(--g-text-body-1-line-height)',
};

interface HealthcheckDrawerTitleProps {
    title: React.ReactNode;
    status?: SelfCheckResult;
    currentHealth?: {Overall?: EFlag; error?: string};
}

export function HealthcheckDrawerTitle({
    title,
    status,
    currentHealth,
}: HealthcheckDrawerTitleProps) {
    return (
        <Flex as="span" direction="column">
            <Text as="span" variant="subheader-2">
                {title}
            </Text>
            {currentHealth ? (
                <Flex
                    direction="column"
                    gap={1}
                    role="group"
                    aria-label={i18n('label_current-health')}
                >
                    <Flex alignItems="center" gap={2}>
                        <Text color="secondary">{i18n('label_current-health')}</Text>
                        <EntityStatus.Label
                            status={
                                currentHealth.error || !isEnumMember(EFlag, currentHealth.Overall)
                                    ? EFlag.Grey
                                    : currentHealth.Overall
                            }
                        />
                    </Flex>
                    {currentHealth.error ? (
                        <Text color="secondary">{currentHealth.error}</Text>
                    ) : null}
                </Flex>
            ) : (
                <Text as="span" color="secondary" style={STATUS_ROW_STYLE}>
                    {status ? HEALTHCHECK_RESULT_TO_TEXT[status] : null}
                </Text>
            )}
        </Flex>
    );
}
