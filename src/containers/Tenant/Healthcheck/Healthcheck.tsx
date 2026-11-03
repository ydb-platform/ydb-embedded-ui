import React from 'react';

import {Flex, Icon, Text} from '@gravity-ui/uikit';

import {useDrawerContextInternal} from '../../../components/Drawer/DrawerContext';
import {
    ResponseError,
    ResponseErrorMessage,
    useErrorInfo,
} from '../../../components/Errors/ResponseError';
import {Fullscreen} from '../../../components/Fullscreen/Fullscreen';
import {HealthcheckStatus} from '../../../components/HealthcheckStatus/HealthcheckStatus';
import {Loader} from '../../../components/Loader';
import type {IssuesTree} from '../../../store/reducers/healthcheckInfo/types';
import {SelfCheckResult} from '../../../types/api/healthcheck';
import type {ETenantType} from '../../../types/api/tenant';
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
import {b} from './shared';
import type {HealthcheckAssistantSnapshot, HealthcheckAssistantTarget} from './types';
import {useClusterHealthcheck, useHealthcheck} from './useHealthcheck';
import {
    countHealthcheckIssuesByCategory,
    getDatabaseHealthcheckAssistantTarget,
    getHealthcheckAssistantContext,
} from './utils';

import cryCatIcon from '../../../assets/icons/cry-cat.svg';

import './Healthcheck.scss';

type HealthcheckDetailsProps = (
    | {
          database: string;
          clusterName?: string;
          databaseType?: ETenantType;
          scope?: 'cluster' | 'database';
      }
    | {
          clusterName: string;
          database?: undefined;
          databaseType?: undefined;
          scope?: 'cluster';
          currentHealth?: {error?: string};
      }
) & {
    healthStatusNow?: number;
    targetIssueId?: string;
    targetLeafIssueId?: string;
    targetLeafIssueRef?: React.Ref<HTMLDivElement>;
};

export function Healthcheck(props: HealthcheckDetailsProps) {
    if (props.database !== undefined) {
        return (
            <HealthcheckContext.Provider
                value={{database: props.database, clusterName: props.clusterName}}
            >
                <DatabaseHealthcheckInner
                    database={props.database}
                    clusterName={props.clusterName}
                    databaseType={props.databaseType}
                    scope={props.scope}
                    targetIssueId={props.targetIssueId}
                    targetLeafIssueId={props.targetLeafIssueId}
                    targetLeafIssueRef={props.targetLeafIssueRef}
                />
            </HealthcheckContext.Provider>
        );
    }

    return (
        <HealthcheckContext.Provider value={{clusterName: props.clusterName}}>
            <ClusterHealthcheckInner
                clusterName={props.clusterName}
                healthStatusNow={props.healthStatusNow}
                currentHealth={props.currentHealth}
            />
        </HealthcheckContext.Provider>
    );
}

function DatabaseHealthcheckInner({
    database,
    clusterName,
    databaseType,
    scope = 'database',
    targetIssueId,
    targetLeafIssueId,
    targetLeafIssueRef,
}: {
    database: string;
    clusterName?: string;
    databaseType?: ETenantType;
    scope?: 'cluster' | 'database';
    targetIssueId?: string;
    targetLeafIssueId?: string;
    targetLeafIssueRef?: React.Ref<HTMLDivElement>;
}) {
    const healthcheck = useHealthcheck(database, {clusterName, databaseType});
    const target = getDatabaseHealthcheckAssistantTarget({database, clusterName, scope});

    return (
        <HealthcheckContent
            healthcheck={healthcheck}
            target={target}
            targetIssueId={targetIssueId}
            targetLeafIssueId={targetLeafIssueId}
            targetLeafIssueRef={targetLeafIssueRef}
        />
    );
}

function ClusterHealthcheckInner({
    clusterName,
    healthStatusNow,
    currentHealth,
}: {
    clusterName: string;
    healthStatusNow?: number;
    currentHealth?: {error?: string};
}) {
    const healthcheck = useClusterHealthcheck(clusterName, {now: healthStatusNow});
    return (
        <HealthcheckContent
            healthcheck={healthcheck}
            target={{scope: 'cluster', request: {clusterName}}}
            currentHealth={currentHealth}
        />
    );
}

interface HealthcheckResult {
    leavesIssues: IssuesTree[];
    issues: HealthcheckAssistantSnapshot['issues'];
    loading: boolean;
    successful: boolean;
    error?: unknown;
    refetch: () => void;
    canRefetch: boolean;
    selfCheckResult: SelfCheckResult;
    fulfilledTimeStamp?: number;
}

function HealthcheckContent({
    healthcheck,
    target,
    targetIssueId,
    targetLeafIssueId,
    targetLeafIssueRef,
    currentHealth,
}: {
    healthcheck: HealthcheckResult;
    target: HealthcheckAssistantTarget;
    targetIssueId?: string;
    targetLeafIssueId?: string;
    targetLeafIssueRef?: React.Ref<HTMLDivElement>;
    currentHealth?: {error?: string};
}) {
    const SuccessImage = getIllustration('SuccessOperation');
    const renderAssistantAction = uiFactory.healthcheck.renderAssistantAction;
    const healthcheckContext = React.useContext(HealthcheckContext);
    const {visibleRightInset} = useDrawerContextInternal();

    const fullscreen = useTypedSelector((state) => state.fullscreen);
    const {
        loading,
        successful,
        error,
        selfCheckResult,
        fulfilledTimeStamp,
        leavesIssues,
        issues,
        refetch,
        canRefetch,
    } = healthcheck;
    const errorInfo = useErrorInfo(error);
    const snapshot = React.useMemo<HealthcheckAssistantSnapshot>(
        () => ({
            selfCheckResult,
            issues,
            fulfilledAt: fulfilledTimeStamp,
        }),
        [fulfilledTimeStamp, issues, selfCheckResult],
    );

    const issuesCount = React.useMemo(
        () => countHealthcheckIssuesByCategory(leavesIssues),
        [leavesIssues],
    );
    const assistant = getHealthcheckAssistantContext({
        renderAction: renderAssistantAction,
        successful,
        target,
        snapshot,
    });

    const renderRefresh = () =>
        canRefetch ? (
            <HealthcheckRefresh
                lastFullfiled={currentHealth ? undefined : fulfilledTimeStamp}
                refresh={refetch}
            />
        ) : null;

    const renderControls = () => {
        return (
            <Flex direction="column" gap={3} className={b('controls', {fullscreen})}>
                <Flex justifyContent="space-between" gap={2}>
                    <Flex gap={2} alignItems="center">
                        {currentHealth ? (
                            <Text variant="subheader-1">{i18n('label_saved-issues')}</Text>
                        ) : (
                            <HealthcheckStatus status={selfCheckResult} />
                        )}
                        {assistant && issues.length > 0
                            ? assistant.renderAction({
                                  action: 'diagnostics',
                                  target: assistant.target,
                                  snapshot: assistant.snapshot,
                              })
                            : null}
                    </Flex>
                    {renderRefresh()}
                </Flex>
                {currentHealth ? (
                    <Text color="secondary">{i18n('description_saved-issues')}</Text>
                ) : null}
                {!currentHealth || leavesIssues.length ? (
                    <React.Fragment>
                        <HealthcheckView issuesCount={issuesCount} />
                        <HealthcheckFilter />
                    </React.Fragment>
                ) : null}
            </Flex>
        );
    };

    const renderError = () => {
        if (!error) {
            return null;
        }
        if (currentHealth && currentHealth.error === errorInfo.title) {
            return errorInfo.showSubtitle || errorInfo.details ? (
                <ResponseErrorMessage
                    subtitle={errorInfo.subtitle}
                    showSubtitle={errorInfo.showSubtitle}
                    details={errorInfo.details}
                    renderedTitle={currentHealth.error}
                />
            ) : null;
        }
        return <ResponseError error={error} defaultMessage={i18n('description_no-data')} />;
    };

    const renderContent = () => {
        if (!currentHealth && error && !leavesIssues.length) {
            return (
                <Flex direction="column" gap={1} className={b('stub-wrapper')}>
                    <ResponseError error={error} defaultMessage={i18n('description_no-data')} />
                    <Icon data={cryCatIcon} size={100} />
                    {renderRefresh()}
                </Flex>
            );
        }

        if (loading) {
            return <Loader size="m" />;
        }

        if (!currentHealth && selfCheckResult === SelfCheckResult.GOOD && !leavesIssues.length) {
            return (
                <Flex direction="column" gap={1} className={b('stub-wrapper')}>
                    <SuccessImage width={200} height={200} />
                    {HEALTHCHECK_RESULT_TO_TEXT[selfCheckResult]}
                    {renderRefresh()}
                </Flex>
            );
        }

        return (
            <Flex direction="column" grow={1}>
                {renderError()}
                {renderControls()}
                <Flex direction="column" gap={4} grow={1} className={b('issues')}>
                    {currentHealth && !leavesIssues.length ? (
                        <Text color="secondary">{i18n('label_no-saved-issues')}</Text>
                    ) : (
                        <Issues
                            issues={leavesIssues}
                            targetIssueId={targetIssueId}
                            targetLeafIssueId={targetLeafIssueId}
                            targetLeafIssueRef={targetLeafIssueRef}
                        />
                    )}
                </Flex>
            </Flex>
        );
    };

    return (
        <HealthcheckContext.Provider value={{...healthcheckContext, assistant}}>
            <Fullscreen rightInset={visibleRightInset}>
                <Flex
                    className={b()}
                    grow={1}
                    role={currentHealth ? 'region' : undefined}
                    aria-label={currentHealth ? i18n('label_saved-issues') : undefined}
                >
                    {renderContent()}
                </Flex>
            </Fullscreen>
        </HealthcheckContext.Provider>
    );
}
