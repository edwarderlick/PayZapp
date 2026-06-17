import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@coral-xyz/anchor': path.resolve(__dirname, 'src/stubs/anchor-stub.ts'),
    },
  },
  optimizeDeps: {
    include: [
      'bn.js',
      'bs58',
      '@solana/web3.js',
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-wallets',
      '@solana/wallet-adapter-base',
      '@circle-fin/swap-kit',
      '@circle-fin/bridge-kit',
      '@circle-fin/unified-balance-kit',
      '@circle-fin/adapter-viem-v2',
    ],
  },
  server: {
    proxy: {
      // Circle Swap + telemetry API
      '/proxy/circle-api': {
        target: 'https://api.circle.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/proxy\/circle-api/, ''),
      },
      // Bridge attestation (mainnet)
      '/proxy/iris-api': {
        target: 'https://iris-api.circle.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/proxy\/iris-api/, ''),
      },
      // Bridge attestation (testnet/sandbox)
      '/proxy/iris-sandbox': {
        target: 'https://iris-api-sandbox.circle.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/proxy\/iris-sandbox/, ''),
      },
      // Unified Balance Kit gateway (mainnet)
      '/proxy/gateway-api': {
        target: 'https://gateway-api.circle.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/proxy\/gateway-api/, ''),
      },
      // Unified Balance Kit gateway (testnet)
      '/proxy/gateway-testnet': {
        target: 'https://gateway-api-testnet.circle.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/proxy\/gateway-testnet/, ''),
      },
    },
  },
})
