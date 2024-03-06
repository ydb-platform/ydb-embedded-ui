import type {Reducer} from '@reduxjs/toolkit';

import type {HeaderAction, HeaderState, Page, PageBreadcrumbsOptions} from './types';

const SET_HEADER_BREADCRUMBS = 'header/SET_HEADER_BREADCRUMBS';

const initialState = {
    pageBreadcrumbsOptions: {},
};

const header: Reducer<HeaderState, HeaderAction> = (state = initialState, action) => {
    switch (action.type) {
        case SET_HEADER_BREADCRUMBS:
            return {
                page: action.page,
                pageBreadcrumbsOptions: action.options,
            };
        default:
            return state;
    }
};

export function setHeaderBreadcrumbs<T extends Page>(page: T, options: PageBreadcrumbsOptions<T>) {
    return {
        type: SET_HEADER_BREADCRUMBS,
        page,
        options,
    } as const;
}

export default header;
