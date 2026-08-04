import React from 'react';

import {Flex, Icon} from '@gravity-ui/uikit';

import {
    useComponent,
    useHasComponent,
} from '../../../components/ComponentsProvider/ComponentsProvider';
import {ResponseError} from '../../../components/Errors/ResponseError';
import {Fullscreen} from '../../../components/Fullscreen/Fullscreen';
import {HealthcheckStatus} from '../../../components/HealthcheckStatus/HealthcheckStatus';
import {Loader} from '../../../components/Loader';
import type {IssuesTree} from '../../../store/reducers/healthcheckInfo/types';
import {SelfCheckResult} from '../../../types/api/healthcheck';
import type {ETenantType} from '../../../types/api/tenant';
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
import {countHealthcheckIssuesByCategory} from './utils';

import cryCatIcon from '../../../assets/icons/cry-cat.svg';

import './Healthcheck.scss';

type HealthcheckDetailsProps =
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
                />
            </HealthcheckContext.Provider>
        );
    }

    return (
        <HealthcheckContext.Provider value={{clusterName: props.clusterName}}>
            <ClusterHealthcheckInner clusterName={props.clusterName} />
        </HealthcheckContext.Provider>
    );
}

function DatabaseHealthcheckInner({
    database,
    clusterName,
    databaseType,
    scope = 'database',
}: {
    database: string;
    clusterName?: string;
    databaseType?: ETenantType;
    scope?: 'cluster' | 'database';
}) {
    const healthcheck = useHealthcheck(database, {clusterName, databaseType});
    return <HealthcheckContent healthcheck={healthcheck} target={{scope, request: {database}}} />;
}

function ClusterHealthcheckInner({clusterName}: {clusterName: string}) {
    const healthcheck = useClusterHealthcheck(clusterName);
    return (
        <HealthcheckContent
            healthcheck={healthcheck}
            target={{scope: 'cluster', request: {clusterName}}}
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
    selfCheckResult: SelfCheckResult;
    fulfilledTimeStamp?: number;
}

function HealthcheckContent({
    healthcheck,
    target,
}: {
    healthcheck: HealthcheckResult;
    target: HealthcheckAssistantTarget;
}) {
    const SuccessImage = getIllustration('SuccessOperation');
    const HealthcheckAssistantAction = useComponent('HealthcheckAssistantAction');
    const hasHealthcheckAssistantAction = useHasComponent('HealthcheckAssistantAction');
    const healthcheckContext = React.useContext(HealthcheckContext);

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
    } = healthcheck;
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
    const showDiagnostics = hasHealthcheckAssistantAction && successful && issues.length > 0;
    const assistant = hasHealthcheckAssistantAction ? {target, snapshot} : undefined;

    const renderControls = () => {
        return (
            <Flex direction="column" gap={3} className={b('controls', {fullscreen})}>
                <Flex justifyContent="space-between" gap={2}>
                    <HealthcheckStatus status={selfCheckResult} />
                    {showDiagnostics ? (
                        <Flex gap={2} alignItems="center">
                            <HealthcheckAssistantAction
                                action="diagnostics"
                                target={target}
                                snapshot={snapshot}
                            />
                            <HealthcheckRefresh
                                lastFullfiled={fulfilledTimeStamp}
                                refresh={refetch}
                            />
                        </Flex>
                    ) : (
                        <HealthcheckRefresh lastFullfiled={fulfilledTimeStamp} refresh={refetch} />
                    )}
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
        <HealthcheckContext.Provider value={{...healthcheckContext, assistant}}>
            <Fullscreen>
                <Flex className={b()} grow={1}>
                    {renderContent()}
                </Flex>
            </Fullscreen>
        </HealthcheckContext.Provider>
    );
}
