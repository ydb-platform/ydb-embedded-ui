/* eslint-env node */
const {createProxyMiddleware} = require('http-proxy-middleware');

module.exports = function (app) {
    const metaYdbBackend = process.env.META_YDB_BACKEND;
    const chatServerUrl = process.env.CHAT_SERVER_URL || 'http://localhost:3001';

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

    // Proxy for chat server
    app.use(
        '/api/chat',
        createProxyMiddleware({
            target: chatServerUrl,
            changeOrigin: true,
            pathRewrite: {
                '^/api/chat': '/api/chat',
            },
            onError: (err, req, res) => {
                console.error('Chat server proxy error:', err.message);
                res.status(503).json({
                    error: 'Chat service unavailable',
                    message: 'Unable to connect to chat server',
                });
            },
            onProxyReq: (_proxyReq, req) => {
                // Log chat requests for debugging
                console.log(`[Chat Proxy] ${req.method} ${req.url} -> ${chatServerUrl}${req.url}`);
            },
        }),
    );

    // Proxy for quota API
    app.use(
        '/api/quota',
        createProxyMiddleware({
            target: chatServerUrl,
            changeOrigin: true,
            pathRewrite: {
                '^/api/quota': '/api/quota',
            },
            onError: (err, req, res) => {
                console.error('Quota server proxy error:', err.message);
                res.status(503).json({
                    error: 'Quota service unavailable',
                    message: 'Unable to connect to quota server',
                });
            },
            onProxyReq: (proxyReq, req) => {
                // Log quota requests for debugging
                console.log(`[Quota Proxy] ${req.method} ${req.url} -> ${chatServerUrl}${req.url}`);
            },
        }),
    );

    // Proxy for usage API
    app.use(
        '/api/usage',
        createProxyMiddleware({
            target: chatServerUrl,
            changeOrigin: true,
            pathRewrite: {
                '^/api/usage': '/api/usage',
            },
            onError: (err, req, res) => {
                console.error('Usage server proxy error:', err.message);
                res.status(503).json({
                    error: 'Usage service unavailable',
                    message: 'Unable to connect to usage server',
                });
            },
            onProxyReq: (proxyReq, req) => {
                // Log usage requests for debugging
                console.log(`[Usage Proxy] ${req.method} ${req.url} -> ${chatServerUrl}${req.url}`);
            },
        }),
    );
};
