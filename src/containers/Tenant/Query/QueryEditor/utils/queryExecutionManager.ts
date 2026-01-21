type AbortablePromiseLike = PromiseLike<unknown> & {
    abort: VoidFunction;
    finally: (onFinally?: (() => void) | null) => PromiseLike<unknown>;
};

class QueryExecutionManager {
    private readonly queries = new Map<string, {abort: VoidFunction}>();

    registerQuery(tabId: string, query: AbortablePromiseLike) {
        this.queries.set(tabId, query);

        const queryRef = query;
        query.finally(() => {
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

export const queryExecutionManagerInstance = new QueryExecutionManager();
