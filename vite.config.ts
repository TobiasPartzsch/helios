import { defineConfig } from 'vite'

export default defineConfig({
    base: '/helios/',
    server: {
        proxy: {
            '/api-horizon': {
                target: 'https://www.heywhatsthat.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api-horizon/, '/api')
            }
        }
    }
})