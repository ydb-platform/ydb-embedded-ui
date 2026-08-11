type AbortablePromiseLike = PromiseLike<unknown> & {
    abort: VoidFunction;
    finally: (onFinally?: (() => void) | null) => PromiseLike<unknown>;
};

interface ActiveQuery {
    database: string;
    query: AbortablePromiseLike;
}

class QueryExecutionManager {
    private readonly queries = new Map<string, ActiveQuery>();

    registerQuery(tabId: string, query: AbortablePromiseLike, database: string) {
        const activeQuery = {database, query};
        this.queries.set(tabId, activeQuery);

        query.finally(() => {
            if (this.queries.get(tabId) === activeQuery) {
                this.queries.delete(tabId);
            }
        });
    }

    getQueryDatabase(tabId: string) {
        return this.queries.get(tabId)?.database;
    }

    abortQuery(tabId: string) {
        const activeQuery = this.queries.get(tabId);
        if (activeQuery) {
            activeQuery.query.abort();
            this.queries.delete(tabId);
        }
    }

    abortAll() {
        for (const activeQuery of this.queries.values()) {
            activeQuery.query.abort();
        }
        this.queries.clear();
    }
}

export const queryExecutionManagerInstance = new QueryExecutionManager();
