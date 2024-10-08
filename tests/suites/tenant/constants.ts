// Long running query for tests
// May cause Memory exceed on real database

const simpleQuery = 'SELECT 1;';

// 400 is pretty enough
export const longRunningQuery = new Array(400).fill(simpleQuery).join('');
