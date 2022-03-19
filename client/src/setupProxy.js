const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    createProxyMiddleware('/api',
    {
        target: 'wss://port-8080-galaxy-lee508578.preview.codeanywhere.com/api',
        ws: true,
        changeOrigin: true,
    })
  );
};