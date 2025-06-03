/* eslint-env node */
const {createProxyMiddleware} = require('http-proxy-middleware');

module.exports = function (app) {
    const metaYdbBackend = process.env.META_YDB_BACKEND;

    // Proxy for existing YDB meta backend
    if (metaYdbBackend && metaYdbBackend !== 'undefined') {
        app.use(
            '/meta',
            createProxyMiddleware({
                target: metaYdbBackend,
                changeOrigin: true,
            }),
        );
    }
};
