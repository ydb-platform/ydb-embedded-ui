import {useDispatch} from 'react-redux';

import type {AppDispatch} from '../../store';

export const useTypedDispatch: () => AppDispatch = useDispatch;
