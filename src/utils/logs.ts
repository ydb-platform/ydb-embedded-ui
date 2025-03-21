interface GetLogsLinkProps {
    dbName: string;
    logging: string;
}

export type GetLogsLink = (props: GetLogsLinkProps) => string;

export function getLogsLink({dbName, logging}: GetLogsLinkProps): string {
    try {
        const data = JSON.parse(logging);

        if (typeof data === 'object' && 'url' in data) {
            const logUrl = data.url;
            if (!logUrl) {
                return '';
            }

            const url = new URL(logUrl);

            const queryParam = url.searchParams.get('query');
            if (queryParam) {
                const decodedQuery = decodeURIComponent(queryParam);

                const updatedQuery = decodedQuery.replace(/\{([^}]*)\}/, (_match, contents) => {
                    const trimmedContents = contents.trim();
                    return `{${trimmedContents}${trimmedContents ? ', ' : ''}database = "${dbName}"}`;
                });

                url.searchParams.set('query', updatedQuery);
            }

            return url.toString();
        }
    } catch {}

    return '';
}
