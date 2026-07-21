import {YQLCodePreview} from '../../../../components/YQLCodePreview/YQLCodePreview';
import type {TEvDescribeSchemeResult} from '../../../../types/api/schema';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../utils/constants';
import {getEntityName} from '../../utils';
import i18n from '../i18n';
import {renderNoEntityDataError} from '../utils';

interface ViewInfoProps {
    data?: TEvDescribeSchemeResult;
}

export function ViewInfo({data}: ViewInfoProps) {
    const entityName = getEntityName(data?.PathDescription);

    if (!data) {
        return renderNoEntityDataError(entityName);
    }

    const queryText = data.PathDescription?.ViewDescription?.QueryText;

    return (
        <YQLCodePreview
            title={i18n('view.query-text-title')}
            text={queryText || EMPTY_DATA_PLACEHOLDER}
        />
    );
}
