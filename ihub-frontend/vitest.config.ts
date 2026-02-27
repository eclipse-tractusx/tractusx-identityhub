import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@config': path.resolve(__dirname, 'src/config'),
            '@services': path.resolve(__dirname, 'src/services'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/__tests__/setup.ts'],
        include: ['src/**/*.test.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'text-summary', 'lcov'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/main.tsx',
                'src/vite-env.d.ts',
                'src/__tests__/**',
                'src/assets/**',
            ],
        },
    },
    define: {
        __APP_VERSION__: JSON.stringify('0.1.0'),
        __BUILD_TIME__: JSON.stringify('2025-01-01T00:00:00Z'),
        __BUILD_MODE__: JSON.stringify('test'),
    },
});
