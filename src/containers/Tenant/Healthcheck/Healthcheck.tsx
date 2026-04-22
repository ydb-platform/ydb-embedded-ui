import React from 'react';

import {Flex, Icon} from '@gravity-ui/uikit';

import {ResponseError} from '../../../components/Errors/ResponseError';
import {Fullscreen} from '../../../components/Fullscreen/Fullscreen';
import {HealthcheckStatus} from '../../../components/HealthcheckStatus/HealthcheckStatus';
import {Loader} from '../../../components/Loader';
import type {IssuesTree} from '../../../store/reducers/healthcheckInfo/types';
import {SelfCheckResult} from '../../../types/api/healthcheck';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {useTypedSelector} from '../../../utils/hooks';
import {getIllustration} from '../../../utils/illustrations';
import {HEALTHCHECK_RESULT_TO_TEXT} from '../constants';

import {HealthcheckContext} from './HealthcheckContext';
import {HealthcheckFilter} from './components/HealthcheckFilter';
import {Issues} from './components/HealthcheckIssues';
import {HealthcheckRefresh} from './components/HealthcheckRefresh';
import {HealthcheckView} from './components/HealthcheckView';
import i18n from './i18n';
import type {CommonIssueType} from './shared';
import {b} from './shared';
import {useClusterHealthcheck, useHealthcheck} from './useHealthcheck';

import cryCatIcon from '../../../assets/icons/cry-cat.svg';

import './Healthcheck.scss';

interface HealthcheckBaseProps {
    countIssueTypes?: (
        issueTrees: IssuesTree[],
    ) => Record<CommonIssueType, number> & Record<string, number>;
}

type HealthcheckDetailsProps = HealthcheckBaseProps &
    ({database: string; clusterName?: undefined} | {clusterName: string; database?: undefined});

export function Healthcheck({
    database,
    clusterName,
    countIssueTypes = uiFactory.healthcheck.countHealthcheckIssuesByType,
}: HealthcheckDetailsProps) {
    if (clusterName) {
        return (
            <HealthcheckContext.Provider value={{clusterName}}>
                <ClusterHealthcheckInner
                    clusterName={clusterName}
                    countIssueTypes={countIssueTypes}
                />
            </HealthcheckContext.Provider>
        );
    }
    return (
        <DatabaseHealthcheckInner database={database as string} countIssueTypes={countIssueTypes} />
    );
}

function DatabaseHealthcheckInner({
    database,
    countIssueTypes,
}: {
    database: string;
    countIssueTypes: NonNullable<HealthcheckBaseProps['countIssueTypes']>;
}) {
    const healthcheck = useHealthcheck(database);
    return <HealthcheckContent healthcheck={healthcheck} countIssueTypes={countIssueTypes} />;
}

function ClusterHealthcheckInner({
    clusterName,
    countIssueTypes,
}: {
    clusterName: string;
    countIssueTypes: NonNullable<HealthcheckBaseProps['countIssueTypes']>;
}) {
    const healthcheck = useClusterHealthcheck(clusterName);
    return <HealthcheckContent healthcheck={healthcheck} countIssueTypes={countIssueTypes} />;
}

interface HealthcheckResult {
    leavesIssues: IssuesTree[];
    loading: boolean;
    error?: unknown;
    refetch: () => void;
    selfCheckResult: SelfCheckResult;
    fulfilledTimeStamp?: number;
}

function HealthcheckContent({
    healthcheck,
    countIssueTypes,
}: {
    healthcheck: HealthcheckResult;
    countIssueTypes: NonNullable<HealthcheckBaseProps['countIssueTypes']>;
}) {
    const SuccessImage = getIllustration('SuccessOperation');

    const fullscreen = useTypedSelector((state) => state.fullscreen);
    const {loading, error, selfCheckResult, fulfilledTimeStamp, leavesIssues, refetch} =
        healthcheck;

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
                    <SuccessImage width={200} height={200} />
                    {HEALTHCHECK_RESULT_TO_TEXT[selfCheckResult]}
                </Flex>
            );
        }

        return (
            <Flex direction="column" grow={1}>
                {renderControls()}
                <Flex direction="column" gap={4} grow={1} className={b('issues')}>
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
