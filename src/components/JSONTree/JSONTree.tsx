import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';
import JSONTreeBase from 'react-json-inspector';

import {cn} from '../../utils/cn';
import {CASE_SENSITIVE_JSON_SEARCH} from '../../utils/constants';
import {useSetting} from '../../utils/hooks';

import i18n from './i18n';

import FontCaseIcon from '@gravity-ui/icons/svgs/font-case.svg';

import './JSONTree.scss';
import 'react-json-inspector/json-inspector.css';

const b = cn('ydb-json-tree');

const DEBAUNCE_TIME = 300;

interface JSONTreeProps extends React.ComponentProps<typeof JSONTreeBase> {
    search?: false;
    treeClassName?: string;
}

export function JSONTree({treeClassName, search, ...rest}: JSONTreeProps) {
    const [caseSensitiveSearch, setCaseSensitiveSearch] = useSetting(
        CASE_SENSITIVE_JSON_SEARCH,
        false,
    );
    return (
        <div className={b()}>
            <JSONTreeBase
                className={b('tree', treeClassName)}
                filterOptions={{
                    ignoreCase: !caseSensitiveSearch,
                }}
                searchOptions={{
                    debounceTime: DEBAUNCE_TIME,
                }}
                {...rest}
            />
            {search !== false && (
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
            )}
        </div>
    );
}
