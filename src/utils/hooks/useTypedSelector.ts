import {TypedUseSelectorHook, useSelector} from 'react-redux';

import {IRootState} from '../../store';

export const useTypedSelector: TypedUseSelectorHook<IRootState> = useSelector;
