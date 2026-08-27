import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Chỉ tách các chunk dữ liệu dạng lá; để Rolldown tự giữ dependency graph của
    // vendor nhằm tránh vòng import/chạy sai thứ tự giữa React và Markdown runtime.
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'source-catalog',
              test: /src[\\/]content[\\/]generated/,
              includeDependenciesRecursively: false,
            },
            {
              name: 'learning-content',
              test: /src[\\/]content[\\/]knowledge/,
              includeDependenciesRecursively: false,
            },
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
})
