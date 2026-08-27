import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Kastriva Bellmatic',
        short_name: 'KastrivaBell',
        description: 'Sistem Bell Sekolah Otomatis - Kastriva',
        theme_color: '#1e3a8a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          { src: '/icons/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3}'],
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
      },
    }),
  ],
  server: { port: 5173, host: true },
});
