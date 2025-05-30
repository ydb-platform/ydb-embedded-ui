import {Search} from '../../../../components/Search';
import {useTenantQueryParams} from '../../useTenantQueryParams';
import i18n from '../i18n';

export function HealthcheckFilter() {
    const {issuesFilter, handleIssuesFilterChange} = useTenantQueryParams();
    return (
        <Search
            value={issuesFilter ?? ''}
            onChange={handleIssuesFilterChange}
            placeholder={i18n('description_search-issue')}
            width="250px"
        />
    );
}
