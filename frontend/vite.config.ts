import {defineConfig} from 'vite'
import {VitePWA} from 'vite-plugin-pwa'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'prompt',
            includeAssets: ['favicon.png', 'apple-touch-icon.png'],
            devOptions: {
                enabled: true,
            },
            manifest: {
                name: 'Dengwa AI',
                short_name: 'Dengwa',
                description: 'Language learning platform',
                theme_color: '#1a1a2e',      // echte Farbe eintragen
                background_color: '#1a1a2e', // echte Farbe eintragen
                display: 'standalone',
                start_url: '/',
                icons: [
                    {src: 'icon-192.png', sizes: '192x192', type: 'image/png'},
                    {src: 'icon-512.png', sizes: '512x512', type: 'image/png'},
                    {src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'},
                ],
            },
            workbox: {
                globPatterns: [], // nichts precachen — kein Offline-Verhalten
            },
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
