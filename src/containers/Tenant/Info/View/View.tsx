import {YQLCodePreview} from '../../../../components/YQLCodePreview/YQLCodePreview';
import type {TEvDescribeSchemeResult} from '../../../../types/api/schema';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../utils/constants';
import tenantKeyset from '../../i18n';

interface ViewInfoProps {
    data?: TEvDescribeSchemeResult;
}

export function ViewInfo({data}: ViewInfoProps) {
    if (!data) {
        return null;
    }

    const queryText = data.PathDescription?.ViewDescription?.QueryText;

    return (
        <YQLCodePreview
            title={tenantKeyset('title_query-text')}
            text={queryText || EMPTY_DATA_PLACEHOLDER}
        />
    );
}
