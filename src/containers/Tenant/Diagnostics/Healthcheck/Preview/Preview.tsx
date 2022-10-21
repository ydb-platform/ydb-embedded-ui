import cn from 'bem-cn-lite';

import {Button, Icon} from '@gravity-ui/uikit';

import updateArrow from '../../../../../assets/icons/update-arrow.svg';

import {SelfCheckResult} from '../../../../../types/api/healthcheck';
import type {IIssuesTree} from '../../../../../types/store/healthcheck';

import {PreviewItem} from './PreviewItem';

import i18n from '../i18n';

const b = cn('healthcheck');

interface PreviewProps {
    selfCheckResult: SelfCheckResult;
    issuesTrees?: IIssuesTree[];
    loading?: boolean;
    onShowMore?: (id: string) => void;
    onUpdate: VoidFunction;
}

export const Preview = (props: PreviewProps) => {
    const {selfCheckResult, issuesTrees, loading, onShowMore, onUpdate} = props;

    const isStatusOK = selfCheckResult === SelfCheckResult.GOOD;

    if (!issuesTrees) {
        return null;
    }

    const renderStatus = () => {
        const modifier = selfCheckResult.toLowerCase();

        return (
            <div className={b('status-wrapper')}>
                <div className={b('preview-title')}>{i18n('title.healthcheck')}</div>
                <div className={b('self-check-status-indicator', {[modifier]: true})}>
                    {selfCheckResult}
                </div>
                <Button size="s" onClick={onUpdate} loading={loading} view="flat-secondary">
                    <Icon data={updateArrow} width={20} height={20} />
                </Button>
            </div>
        );
    };

    const renderFirstLevelIssues = () => {
        return (
            <div className={b('preview-content')}>
                {isStatusOK
                    ? i18n('status_message.ok')
                    : issuesTrees?.map((issueTree) => (
                          <PreviewItem
                              key={issueTree.id}
                              data={issueTree}
                              onShowMore={onShowMore}
                          />
                      ))}
            </div>
        );
    };

    return (
        <div className={b('preview')}>
            {renderStatus()}
            {renderFirstLevelIssues()}
        </div>
    );
};
