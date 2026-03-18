export default {
  dev: {
    '/api': {
      target: 'http://127.0.0.1:11451/',
      changeOrigin: true,
    },
    '/upload': {
      target: 'http://127.0.0.1:11451/',
      changeOrigin: true,
    },
    '/static': {
      target: 'http://127.0.0.1:11451/',
      changeOrigin: true,
    },
    '/output': {
      target: 'http://127.0.0.1:11451/',
      changeOrigin: true,
    }
  },
};