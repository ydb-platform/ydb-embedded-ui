import {useTypedDispatch, useTypedSelector} from '../../../utils/hooks';

import {changeFilter, selectProblemFilter} from './settings';
import type {ProblemFilterValue} from './types';

export function useProblemFilter() {
    const dispatch = useTypedDispatch();

    const problemFilter = useTypedSelector(selectProblemFilter);

    const handleProblemFilterChange = (value: ProblemFilterValue) => {
        dispatch(changeFilter(value));
    };

    return {
        problemFilter,
        handleProblemFilterChange,
    };
}
