import cn from 'bem-cn-lite';

import {Link} from '@gravity-ui/uikit';

import {SelfCheckResult, type StatusFlag} from '../../../../../types/api/healthcheck';
import type {IIssuesTree} from '../../../../../types/store/healthcheck';
import {useTypedSelector} from '../../../../../utils/hooks';
import {selectIssuesTreesRoots} from '../../../../../store/reducers/healthcheckInfo';
import EntityStatus from '../../../../../components/EntityStatus/EntityStatus';
import {DiagnosticCard} from '../../../../../components/DiagnosticCard/DiagnosticCard';

import i18n from '../i18n';

const b = cn('healthcheck');

interface PreviewProps {
    selfCheckResult: SelfCheckResult;
    issuesTrees?: IIssuesTree[];
    loading?: boolean;
    onShowMore?: (issueIds: string[]) => void;
    onUpdate: VoidFunction;
}

export const Preview = ({selfCheckResult, issuesTrees, onShowMore}: PreviewProps) => {
    const isStatusOK = selfCheckResult === SelfCheckResult.GOOD;

    const issuesTreesRoots = useTypedSelector(selectIssuesTreesRoots);

    if (!issuesTrees) {
        return null;
    }

    const issues = {} as Record<StatusFlag, number>;

    for (const issue of issuesTrees) {
        if (!issues[issue.status]) {
            issues[issue.status] = 0;
        }
        issues[issue.status]++;
    }

    const renderStatus = () => {
        const modifier = selfCheckResult.toLowerCase();

        return (
            <div className={b('status-wrapper')}>
                <div className={b('preview-title')}>{i18n('title.healthcheck')}</div>
                <div className={b('self-check-status-indicator', {[modifier]: true})}>
                    {selfCheckResult}
                </div>
            </div>
        );
    };

    const renderFirstLevelIssues = () => {
        return (
            <div className={b('preview-content')}>
                {isStatusOK ? (
                    i18n('status_message.ok')
                ) : (
                    <>
                        <div>Issues:</div>
                        <div className={b('issues')}>
                            {Object.entries(issues).map(([status, count]) => {
                                return (
                                    <EntityStatus
                                        key={status}
                                        mode="icons"
                                        status={status}
                                        label={count.toString()}
                                        size="l"
                                    />
                                );
                            })}
                        </div>
                        <Link
                            onClick={() => onShowMore?.(issuesTreesRoots.map((issue) => issue.id))}
                        >
                            {i18n('label.show-details')}
                        </Link>
                    </>
                )}
            </div>
        );
    };

    return (
        <DiagnosticCard className={b('preview')}>
            {renderStatus()}
            {renderFirstLevelIssues()}
        </DiagnosticCard>
    );
};
