declare module 'react-json-inspector' {
    // This typing is sufficient for current use cases, but some types are incompelete
    class JSONTree extends React.Component<{
        data?: object;
        search?: boolean;
        searchOptions?: {
            debounceTime?: number;
        };
        onClick?: ({path: string, key: string, value: object}) => void;
        validateQuery?: (query: string) => boolean;
        isExpanded?: (keypath: string) => boolean;
        filterOptions?: {
            cacheResults?: bool;
            ignoreCase?: bool;
        };
        query?: string;
        verboseShowOriginal?: boolean;
        className?: string;
    }> {}
    export default JSONTree;
}
