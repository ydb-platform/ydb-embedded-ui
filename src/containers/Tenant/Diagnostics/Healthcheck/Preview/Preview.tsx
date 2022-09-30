import cn from 'bem-cn-lite';

import {Button} from '@gravity-ui/uikit';

import i18n from '../i18n';

const b = cn('healthcheck');

interface PreviewProps {
    data?: any;
    loading?: boolean;
    onShowMore?: VoidFunction;
    onUpdate: VoidFunction;
}

export const Preview = (props: PreviewProps) => {
    const {
        data,
        loading,
        onShowMore,
        onUpdate,
    } = props;

    if (!data) {
        return null;
    }

    const {self_check_result: selfCheckResult} = data;
    const modifier = selfCheckResult.toLowerCase();

    const statusOk = selfCheckResult === 'GOOD';
    const text = statusOk
        ? i18n('status_message.ok')
        : i18n('status_message.error');

    return (
        <div className={b('preview')}>
            <div className={b('status-wrapper')}>
                <div className={b('preview-title')}>{i18n('title.healthcheck')}</div>
                <div className={b('self-check-status-indicator', {[modifier]: true})}>
                    {statusOk ? i18n('ok') : i18n('error')}
                </div>
                <Button size="s" onClick={onUpdate} loading={loading}>
                    {i18n('label.update')}
                </Button>
            </div>
            <div className={b('preview-content')}>
                {text}
                {!statusOk && (
                    <Button
                        view="flat-info"
                        onClick={onShowMore}
                        size="s"
                    >
                        {i18n('label.show-details')}
                    </Button>
                )}
            </div>
        </div>
    );
};
