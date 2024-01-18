/* eslint-env node */
const {createProxyMiddleware} = require('http-proxy-middleware');

module.exports = function (app) {
    const metaYdbBackend = process.env.META_YDB_BACKEND;
    if (metaYdbBackend) {
        app.use(
            '/api/meta',
            createProxyMiddleware({
                target: metaYdbBackend,
                changeOrigin: true,
                pathRewrite: {'^/api/meta': ''},
            }),
        );
    }
};
