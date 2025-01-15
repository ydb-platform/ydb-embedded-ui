export interface TableState<T> {
    rows: Array<T | undefined>;
    foundEntities: number;
    totalEntities: number;
}

export type TableAction<T> =
    | {type: 'UPDATE_DATA'; payload: {data: T[]; found: number; total: number; offset: number}}
    | {type: 'RESET_ROWS'; payload: {length: number}};

export function tableReducer<T>(state: TableState<T>, action: TableAction<T>): TableState<T> {
    switch (action.type) {
        case 'UPDATE_DATA': {
            const {data, found, total, offset} = action.payload;
            const newLength = found || state.rows.length;

            // Reset rows if length changed
            if (state.rows.length !== newLength) {
                return {
                    rows: new Array(newLength).fill(undefined),
                    foundEntities: found,
                    totalEntities: total,
                };
            }

            // Update only the fetched range
            const newRows = state.rows.slice();
            data.forEach((item, index) => {
                const virtualIndex = offset + index;
                if (virtualIndex < newLength) {
                    newRows[virtualIndex] = item;
                }
            });

            return {
                rows: newRows,
                foundEntities: found,
                totalEntities: total,
            };
        }
        case 'RESET_ROWS': {
            return {
                ...state,
                rows: new Array(action.payload.length).fill(undefined),
            };
        }
        default:
            return state;
    }
}
