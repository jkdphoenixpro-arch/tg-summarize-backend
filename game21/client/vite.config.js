import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: [
      'bypuq-31-144-9-95.a.free.pinggy.link',
      '.ngrok-free.app',
      '.ngrok.io',
      '.ngrok-free.dev',
      '.pinggy.link',
      '.loca.lt',
      'localhost'
    ]
  }
});
