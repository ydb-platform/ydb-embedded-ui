type AbortablePromiseLike = {abort: VoidFunction} & PromiseLike<unknown>;

class QueryManager {
    private readonly queries = new Map<string, {abort: VoidFunction}>();

    registerQuery(tabId: string, query: AbortablePromiseLike) {
        this.queries.set(tabId, query);

        const queryRef = query;
        Promise.resolve(query).finally(() => {
            if (this.queries.get(tabId) === queryRef) {
                this.queries.delete(tabId);
            }
        });
    }

    abortQuery(tabId: string) {
        const query = this.queries.get(tabId);
        if (query) {
            query.abort();
            this.queries.delete(tabId);
        }
    }

    abortAll() {
        for (const query of this.queries.values()) {
            query.abort();
        }
        this.queries.clear();
    }
}

export const queryManagerInstance = new QueryManager();
