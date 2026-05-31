import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('@react-pdf/renderer') || id.includes('pdfkit') || id.includes('fontkit'))
            return 'vendor-pdf';
          if (id.includes('node_modules/antd') || id.includes('@ant-design'))
            return 'vendor-antd';
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('react-router'))
            return 'vendor-react';
          if (id.includes('@tanstack/react-query'))
            return 'vendor-query';
          if (id.includes('i18next') || id.includes('react-i18next'))
            return 'vendor-i18n';
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
