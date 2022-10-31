import {Reducer} from 'redux';

const SET_HEADER = 'SET_HEADER';

type IHeaderAction = ReturnType<typeof setHeader>;
export type HeaderItemType = {text: string; link?: string};

const initialState: HeaderItemType[] = [];

const header: Reducer<HeaderItemType[], IHeaderAction> = function (state = initialState, action) {
    switch (action.type) {
        case SET_HEADER:
            return action.data;
        default:
            return state;
    }
};

export function setHeader(headerItems: HeaderItemType[]) {
    return {
        type: SET_HEADER,
        data: headerItems,
    } as const;
}

export default header;
