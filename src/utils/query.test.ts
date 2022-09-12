import {parseQueryAPIExecuteResponse} from './query';

describe('API utils', () => {
    describe('json/viewer/query', () => {
        describe('parseQueryAPIExecuteResponse', () => {
            describe('old format', () => {
                describe('plain response', () => {
                    it('should handle empty response', () => {
                        expect(parseQueryAPIExecuteResponse(null).result).toBeUndefined();
                    });

                    it('should parse json string', () => {
                        const json = {foo: 'bar'};
                        const response = JSON.stringify(json);
                        expect(parseQueryAPIExecuteResponse(response).result).toEqual(json);
                    });

                    // it should not be in the response, but is there because of a bug
                    it('should ignore request plan as the response', () => {
                        const response = {queries: 'some queries'};
                        expect(parseQueryAPIExecuteResponse(response).result).toBeUndefined();
                    });

                    it('should accept key-value rows', () => {
                        const response = [{foo: 'bar'}];
                        expect(parseQueryAPIExecuteResponse(response).result).toEqual(response);
                    });
                });

                describe('deep response without stats', () => {
                    it('should parse json string in the result field', () => {
                        const json = {foo: 'bar'};
                        const response = {result: JSON.stringify(json)};
                        expect(parseQueryAPIExecuteResponse(response).result).toEqual(json);
                    });

                    // it should not be in the response, but is there because of a bug
                    it('should ignore request plan in the result field', () => {
                        const response = {result: {queries: 'some queries'}};
                        expect(parseQueryAPIExecuteResponse(response).result).toBeUndefined();
                    });

                    it('should accept key-value rows in the result field', () => {
                        const response = {result: [{foo: 'bar'}]};
                        expect(parseQueryAPIExecuteResponse(response).result).toEqual(response.result);
                    });
                });

                describe('deep response with stats', () => {
                    it('should parse json string in the result field', () => {
                        const json = {foo: 'bar'};
                        const response = {
                            result: JSON.stringify(json),
                            stats: {metric: 'good'},
                        };
                        const actual = parseQueryAPIExecuteResponse(response);
                        expect(actual.result).toEqual(json);
                        expect(actual.stats).toEqual(response.stats);
                    });

                    // it should not be in the response, but is there because of a bug
                    it('should ignore request plan in the result field', () => {
                        const response = {
                            result: {queries: 'some queries'},
                            stats: {metric: 'good'},
                        };
                        const actual = parseQueryAPIExecuteResponse(response);
                        expect(actual.result).toBeUndefined();
                        expect(actual.stats).toEqual(response.stats);
                    });

                    it('should accept key-value rows in the result field', () => {
                        const response = {
                            result: [{foo: 'bar'}],
                            stats: {metric: 'good'},
                        };
                        const actual = parseQueryAPIExecuteResponse(response);
                        expect(actual.result).toEqual(response.result);
                        expect(actual.stats).toEqual(response.stats);
                    });

                    it('should accept stats without a result', () => {
                        const response = {
                            stats: {metric: 'good'},
                        };
                        const actual = parseQueryAPIExecuteResponse(response);
                        expect(actual.result).toBeUndefined();
                        expect(actual.stats).toEqual(response.stats);
                    });
                });
            });

            describe('new format', () => {
                describe('response without stats', () => {
                    it('should parse modern schema', () => {
                        const response = {
                            result: [['42', 'hello world']],
                            columns: [{
                                name: 'id',
                                type: 'Uint64?'
                            }, {
                                name: 'value',
                                type: 'Utf8?'
                            }],
                        };
                        const actual = parseQueryAPIExecuteResponse(response);
                        expect(actual.result).toEqual([{
                            id: '42',
                            value: 'hello world'
                        }]);
                        expect(actual.columns).toEqual(response.columns);
                    });

                    it('should handle empty response for classic schema', () => {
                        expect(parseQueryAPIExecuteResponse(null).result).toBeUndefined();
                    });

                    it('should parse plain classic schema', () => {
                        const response = [{foo: 'bar'}];
                        expect(parseQueryAPIExecuteResponse(response).result).toEqual(response);
                    });

                    it('should parse deep classic schema', () => {
                        const response = {result: [{foo: 'bar'}]};
                        expect(parseQueryAPIExecuteResponse(response).result).toEqual(response.result);
                    });

                    it('should parse ydb schema', () => {
                        const response = {result: [{foo: 'bar'}]};
                        expect(parseQueryAPIExecuteResponse(response).result).toEqual(response.result);
                    });
                });

                describe('response with stats', () => {
                    it('should parse modern schema', () => {
                        const response = {
                            result: [['42', 'hello world']],
                            columns: [{
                                name: 'id',
                                type: 'Uint64?'
                            }, {
                                name: 'value',
                                type: 'Utf8?'
                            }],
                            stats: {metric: 'good'},
                        };
                        const actual = parseQueryAPIExecuteResponse(response);
                        expect(actual.result).toEqual([{
                            id: '42',
                            value: 'hello world'
                        }]);
                        expect(actual.columns).toEqual(response.columns);
                        expect(actual.stats).toEqual(response.stats);
                    });

                    it('should parse classic schema', () => {
                        const response = {
                            result: [{foo: 'bar'}],
                            stats: {metric: 'good'},
                        };
                        const actual = parseQueryAPIExecuteResponse(response);
                        expect(actual.result).toEqual(response.result);
                        expect(actual.stats).toEqual(response.stats);
                    });

                    it('should parse ydb schema', () => {
                        const response = {
                            result: [{foo: 'bar'}],
                            stats: {metric: 'good'},
                        };
                        const actual = parseQueryAPIExecuteResponse(response);
                        expect(actual.result).toEqual(response.result);
                        expect(actual.stats).toEqual(response.stats);
                    });

                    it('should accept stats without a result', () => {
                        const response = {
                            stats: {metric: 'good'},
                        };
                        const actual = parseQueryAPIExecuteResponse(response);
                        expect(actual.result).toBeUndefined();
                        expect(actual.columns).toBeUndefined();
                        expect(actual.stats).toEqual(response.stats);
                    });
                });
            });
        });
    });
});
