import '@tanstack/react-table';

declare module '@tanstack/react-table' {
    interface ColumnMeta {
        align?: 'left' | 'right';
        verticalAlign?: 'top' | 'middle';
    }
}
