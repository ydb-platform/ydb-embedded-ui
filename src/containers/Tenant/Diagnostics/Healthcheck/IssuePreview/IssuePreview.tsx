import cn from 'bem-cn-lite';

import {Link, Text} from '@gravity-ui/uikit';

import EntityStatus from '../../../../../components/EntityStatus/EntityStatus';
import {IssueLog} from '../../../../../types/api/healthcheck';

import i18n from '../i18n';

const b = cn('healthcheck');

interface IssuePreviewProps {
    data?: IssueLog;
    onShowMore?: VoidFunction;
}

export const IssuePreview = (props: IssuePreviewProps) => {
    const {
        data,
        onShowMore,
    } = props;

    if (!data) {
        return null;
    }

    return (
        <div className={b('issue-preview')}>
            <EntityStatus mode="icons" status={data.status} name={data.type} />
            <Text as="div" color="secondary" variant="body-2">{data.message}</Text>
            <Link onClick={onShowMore}>{i18n('label.show-details')}</Link>
        </div>
    );
};
