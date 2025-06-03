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
                '^/api/chat': '/api/chat'
            },
            onError: (err, req, res) => {
                console.error('Chat server proxy error:', err.message);
                res.status(503).json({
                    error: 'Chat service unavailable',
                    message: 'Unable to connect to chat server'
                });
            },
            onProxyReq: (proxyReq, req, res) => {
                // Log chat requests for debugging
                console.log(`[Chat Proxy] ${req.method} ${req.url} -> ${chatServerUrl}${req.url}`);
            }
        }),
    );
};
