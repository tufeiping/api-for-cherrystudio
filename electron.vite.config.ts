import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

const visualizerPlugin = (type: 'renderer' | 'main') => {
  return process.env[`VISUALIZER_${type.toUpperCase()}`] ? [visualizer({ open: true })] : []
}

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({
        exclude: [
          '@llm-tools/embedjs',
          '@llm-tools/embedjs-openai',
          '@llm-tools/embedjs-loader-web',
          '@llm-tools/embedjs-loader-markdown',
          '@llm-tools/embedjs-loader-msoffice',
          '@llm-tools/embedjs-loader-xml',
          '@llm-tools/embedjs-loader-pdf',
          '@llm-tools/embedjs-loader-sitemap',
          '@llm-tools/embedjs-libsql',
          '@llm-tools/embedjs-loader-image'
        ]
      }),
      ...visualizerPlugin('main')
    ],
    resolve: {
      alias: {
        '@main': resolve('src/main'),
        '@types': resolve('src/renderer/src/types'),
        '@shared': resolve('packages/shared')
      }
    },
    build: {
      rollupOptions: {
        external: ['@libsql/client', '@llm-tools/embedjs-loader-image']
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    plugins: [react(), ...visualizerPlugin('renderer')],
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('packages/shared')
      }
    },
    optimizeDeps: {
      exclude: ['chunk-QH6N6I7P.js', 'chunk-PB73W2YU.js', 'chunk-AFE5XGNG.js']
    }
  }
})
