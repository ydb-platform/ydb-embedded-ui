// We have endpoint in format grpc://example.com:2139/?database=/root/test
// We need it to be like grpc://example.com:2139 to make code in snippets work
// We pass database to snippets as a separate param
export function prepareEndpoint(connectionString = '') {
    try {
        const urlObj = new URL(connectionString);
        urlObj.search = '';

        let endpoint = urlObj.toString();

        // Remove trailing slash if present
        if (endpoint.endsWith('/')) {
            endpoint = endpoint.slice(0, -1);
        }

        return endpoint;
    } catch {
        return undefined;
    }
}
