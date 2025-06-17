import React from 'react';

import {Flex, Icon} from '@gravity-ui/uikit';

import {ResponseError} from '../../../components/Errors/ResponseError';
import Fullscreen from '../../../components/Fullscreen/Fullscreen';
import {HealthcheckStatus} from '../../../components/HealthcheckStatus/HealthcheckStatus';
import {Illustration} from '../../../components/Illustration';
import {Loader} from '../../../components/Loader';
import type {IssuesTree} from '../../../store/reducers/healthcheckInfo/types';
import {SelfCheckResult} from '../../../types/api/healthcheck';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {useTypedSelector} from '../../../utils/hooks';
import {HEALTHCHECK_RESULT_TO_TEXT} from '../constants';

import {HealthcheckFilter} from './components/HealthcheckFilter';
import {Issues} from './components/HealthcheckIssues';
import {HealthcheckRefresh} from './components/HealthcheckRefresh';
import {HealthcheckView} from './components/HealthcheckView';
import i18n from './i18n';
import type {CommonIssueType} from './shared';
import {b} from './shared';
import {useHealthcheck} from './useHealthcheck';

import cryCatIcon from '../../../assets/icons/cry-cat.svg';

import './Healthcheck.scss';

interface HealthcheckDetailsProps {
    tenantName: string;
    countIssueTypes?: (
        issueTrees: IssuesTree[],
    ) => Record<CommonIssueType, number> & Record<string, number>;
}

export function Healthcheck({
    tenantName,
    countIssueTypes = uiFactory.healthcheck.countHealthcheckIssuesByType,
}: HealthcheckDetailsProps) {
    const fullscreen = useTypedSelector((state) => state.fullscreen);
    const {loading, error, selfCheckResult, fulfilledTimeStamp, leavesIssues, refetch} =
        useHealthcheck(tenantName);

    const issuesCount = React.useMemo(
        () => countIssueTypes(leavesIssues),
        [leavesIssues, countIssueTypes],
    );

    const renderControls = () => {
        return (
            <Flex direction="column" gap={3} className={b('controls', {fullscreen})}>
                <Flex justifyContent="space-between" gap={2}>
                    <HealthcheckStatus status={selfCheckResult} />
                    <HealthcheckRefresh lastFullfiled={fulfilledTimeStamp} refresh={refetch} />
                </Flex>
                <HealthcheckView issuesCount={issuesCount} />
                <HealthcheckFilter />
            </Flex>
        );
    };

    const renderContent = () => {
        if (error) {
            return (
                <Flex direction="column" gap={1} className={b('stub-wrapper')}>
                    <ResponseError error={error} defaultMessage={i18n('description_no-data')} />
                    <Icon data={cryCatIcon} size={100} />
                </Flex>
            );
        }

        if (loading) {
            return <Loader size="m" />;
        }

        if (selfCheckResult === SelfCheckResult.GOOD && (!leavesIssues || !leavesIssues.length)) {
            return (
                <Flex direction="column" gap={1} className={b('stub-wrapper')}>
                    <Illustration name="thumbsUp" width="200" />
                    {HEALTHCHECK_RESULT_TO_TEXT[selfCheckResult]}
                </Flex>
            );
        }

        return (
            <Flex direction="column" grow={1}>
                {renderControls()}
                <Flex direction="column" gap={3} grow={1} className={b('issues')}>
                    <Issues issues={leavesIssues} />
                </Flex>
            </Flex>
        );
    };

    return (
        <Fullscreen>
            <Flex className={b()} grow={1}>
                {renderContent()}
            </Flex>
        </Fullscreen>
    );
}
