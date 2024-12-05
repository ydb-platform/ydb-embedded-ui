import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';
import JSONTree from 'react-json-inspector';

import {cn} from '../../utils/cn';
import {CASE_SENSITIVE_JSON_SEARCH} from '../../utils/constants';
import {useSetting} from '../../utils/hooks';

import i18n from './i18n';

import FontCaseIcon from '@gravity-ui/icons/svgs/font-case.svg';

import './JSONTreeWithSearch.scss';
import 'react-json-inspector/json-inspector.css';

const b = cn('ydb-json-tree-with-search');

interface JSONTreeWithSearchProps extends React.ComponentProps<typeof JSONTree> {
    treeClassName?: string;
}

export function JSONTreeWithSearch({treeClassName, ...rest}: JSONTreeWithSearchProps) {
    const [caseSensitiveSearch, setCaseSensitiveSearch] = useSetting(
        CASE_SENSITIVE_JSON_SEARCH,
        false,
    );
    return (
        <div className={b()}>
            <JSONTree
                className={b('tree', treeClassName)}
                filterOptions={{
                    ignoreCase: !caseSensitiveSearch,
                }}
                searchOptions={{
                    debounceTime: 300,
                }}
                {...rest}
            />
            <ActionTooltip
                title={
                    caseSensitiveSearch
                        ? i18n('context_case-sensitive-search')
                        : i18n('context_case-sensitive-search-disabled')
                }
            >
                <Button
                    view="outlined"
                    className={b('case')}
                    onClick={() => setCaseSensitiveSearch(!caseSensitiveSearch)}
                    selected={caseSensitiveSearch}
                >
                    <Icon data={FontCaseIcon} />
                </Button>
            </ActionTooltip>
        </div>
    );
}
