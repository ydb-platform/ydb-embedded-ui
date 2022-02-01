const SET_HEADER = 'SET_HEADER';

export type HeaderItemType = {text: string; link: string};

const initialState: HeaderItemType[] = [];

const header = function (state = initialState, action: ReturnType<typeof setHeader>) {
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
