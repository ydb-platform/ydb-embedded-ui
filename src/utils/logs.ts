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

                // gets content between curly braces and replaces with {content, database = dbName}
                const updatedQuery = decodedQuery.replace(/\{([^}]*)\}/, (_match, contents) => {
                    const trimmedContents = contents.trim();
                    if (trimmedContents) {
                        return `{${trimmedContents}, database = "${dbName}"}`;
                    } else {
                        return `{database = "${dbName}"}`;
                    }
                });

                url.searchParams.set('query', updatedQuery);
            }

            return url.toString();
        }
    } catch {}

    return '';
}
