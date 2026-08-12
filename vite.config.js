import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  // ✅ Environment variables ni yuklash
  const env = loadEnv(mode, process.cwd(), '')
  
  console.log('🔧 Mode:', mode)
  console.log('🔧 VITE_API_BASE_URL:', env.VITE_API_BASE_URL)
  
  return {
    plugins: [react()],
    
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: [
        'uniflagellate-menseless-tama.ngrok-free.dev',
        'localhost',
        '127.0.0.1',
        '.vercel.app',
      ],
      // ✅ Development proxy
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    
    build: {
      outDir: 'dist',
      sourcemap: true,
      // ✅ Build vaqtida environment variables
      rollupOptions: {
        external: [],
      },
    },
    
    // ✅ Environment variables ni build vaqtida aniqlash
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
    },
  }
})