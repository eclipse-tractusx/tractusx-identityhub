import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

// --- Mocks ---

const mockGetAuthState = vi.fn(() => ({
    isAuthenticated: true,
    isLoading: false,
    error: null,
}));
const mockGetAuthHeaders = vi.fn(() => ({ Authorization: 'Bearer test-token' }));
const mockLogout = vi.fn();

vi.mock('../../services/AuthService', () => ({
    default: {
        getAuthState: () => mockGetAuthState(),
        getAuthHeaders: () => mockGetAuthHeaders(),
        logout: () => mockLogout(),
    },
}));

const mockIsAuthEnabled = vi.fn(() => false);
const mockGetApiConfig = vi.fn(() => ({ timeout: 30000 }));
const mockGetApiHeaders = vi.fn(() => ({ 'Content-Type': 'application/json' }));
const mockGetIhubBackendUrl = vi.fn(() => 'http://localhost:8082');

vi.mock('../../services/EnvironmentService', () => ({
    default: {
        isAuthEnabled: () => mockIsAuthEnabled(),
        getApiConfig: () => mockGetApiConfig(),
        getApiHeaders: () => mockGetApiHeaders(),
    },
    getIhubBackendUrl: () => mockGetIhubBackendUrl(),
}));

// Capture interceptor callbacks when axios.create is called
let requestInterceptor: ((config: InternalAxiosRequestConfig) => Promise<InternalAxiosRequestConfig>) | null = null;
let responseSuccessInterceptor: ((response: unknown) => unknown) | null = null;
let responseErrorInterceptor: ((error: AxiosError) => Promise<never>) | null = null;

vi.mock('axios', () => {
    const mockInstance = {
        interceptors: {
            request: {
                use: vi.fn((onFulfilled: (config: InternalAxiosRequestConfig) => Promise<InternalAxiosRequestConfig>) => {
                    requestInterceptor = onFulfilled;
                }),
            },
            response: {
                use: vi.fn((onFulfilled: (response: unknown) => unknown, onRejected: (error: AxiosError) => Promise<never>) => {
                    responseSuccessInterceptor = onFulfilled;
                    responseErrorInterceptor = onRejected;
                }),
            },
        },
        defaults: { headers: { common: {} } },
    };
    return {
        default: {
            create: vi.fn(() => mockInstance),
        },
    };
});

describe('HttpClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset interceptor captures
        requestInterceptor = null;
        responseSuccessInterceptor = null;
        responseErrorInterceptor = null;

        // Reset module cache so it re-executes module-level code
        vi.resetModules();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should be importable and return an object', async () => {
        const module = await import('../../services/HttpClient');
        expect(module.default).toBeDefined();
    });

    it('should call axios.create with the configured timeout', async () => {
        const axios = await import('axios');
        await import('../../services/HttpClient');
        expect(axios.default.create).toHaveBeenCalledWith({ timeout: 30000 });
    });

    it('should register request and response interceptors', async () => {
        const axios = await import('axios');
        await import('../../services/HttpClient');
        const instance = (axios.default.create as ReturnType<typeof vi.fn>).mock.results[0]?.value;
        expect(instance.interceptors.request.use).toHaveBeenCalledTimes(1);
        expect(instance.interceptors.response.use).toHaveBeenCalledTimes(1);
    });

    describe('request interceptor', () => {
        beforeEach(async () => {
            await import('../../services/HttpClient');
        });

        it('should merge environment and auth headers into the config', async () => {
            expect(requestInterceptor).not.toBeNull();
            mockGetApiHeaders.mockReturnValue({ 'Content-Type': 'application/json' });
            mockGetAuthHeaders.mockReturnValue({ Authorization: 'Bearer my-token' });

            const config = {
                headers: {},
                url: '/api/test',
            } as unknown as InternalAxiosRequestConfig;

            const result = await requestInterceptor!(config);

            expect(result.headers['Content-Type']).toBe('application/json');
            expect(result.headers['Authorization']).toBe('Bearer my-token');
        });

        it('should prepend backend URL to relative paths', async () => {
            expect(requestInterceptor).not.toBeNull();
            mockGetIhubBackendUrl.mockReturnValue('http://localhost:8082');

            const config = {
                headers: {},
                url: '/api/participants',
            } as unknown as InternalAxiosRequestConfig;

            const result = await requestInterceptor!(config);

            expect(result.url).toBe('http://localhost:8082/api/participants');
        });

        it('should NOT prepend backend URL to absolute URLs', async () => {
            expect(requestInterceptor).not.toBeNull();
            mockGetIhubBackendUrl.mockReturnValue('http://localhost:8082');

            const config = {
                headers: {},
                url: 'https://external-service.com/api/data',
            } as unknown as InternalAxiosRequestConfig;

            const result = await requestInterceptor!(config);

            expect(result.url).toBe('https://external-service.com/api/data');
        });

        it('should NOT prepend backend URL when backendUrl is empty', async () => {
            expect(requestInterceptor).not.toBeNull();
            mockGetIhubBackendUrl.mockReturnValue('');

            const config = {
                headers: {},
                url: '/api/test',
            } as unknown as InternalAxiosRequestConfig;

            const result = await requestInterceptor!(config);

            expect(result.url).toBe('/api/test');
        });

        it('should NOT prepend backend URL when config.url is undefined', async () => {
            expect(requestInterceptor).not.toBeNull();
            mockGetIhubBackendUrl.mockReturnValue('http://localhost:8082');

            const config = {
                headers: {},
                url: undefined,
            } as unknown as InternalAxiosRequestConfig;

            const result = await requestInterceptor!(config);

            expect(result.url).toBeUndefined();
        });

        it('should skip waitForAuth when auth is disabled', async () => {
            expect(requestInterceptor).not.toBeNull();
            mockIsAuthEnabled.mockReturnValue(false);

            const config = {
                headers: {},
                url: '/api/test',
            } as unknown as InternalAxiosRequestConfig;

            // Should resolve quickly without polling
            const result = await requestInterceptor!(config);
            expect(result).toBeDefined();
            expect(mockIsAuthEnabled).toHaveBeenCalled();
        });

        it('should wait for auth when auth is enabled and user is authenticated', async () => {
            expect(requestInterceptor).not.toBeNull();
            mockIsAuthEnabled.mockReturnValue(true);
            mockGetAuthState.mockReturnValue({
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });

            const config = {
                headers: {},
                url: '/api/test',
            } as unknown as InternalAxiosRequestConfig;

            const result = await requestInterceptor!(config);
            expect(result).toBeDefined();
        });

        it('should stop waiting when auth state has an error', async () => {
            expect(requestInterceptor).not.toBeNull();
            mockIsAuthEnabled.mockReturnValue(true);
            mockGetAuthState.mockReturnValue({
                isAuthenticated: false,
                isLoading: false,
                error: 'Auth failed' as any,
            });

            const config = {
                headers: {},
                url: '/api/test',
            } as unknown as InternalAxiosRequestConfig;

            const result = await requestInterceptor!(config);
            expect(result).toBeDefined();
        });

        it('should stop waiting when auth is no longer loading', async () => {
            expect(requestInterceptor).not.toBeNull();
            mockIsAuthEnabled.mockReturnValue(true);
            mockGetAuthState.mockReturnValue({
                isAuthenticated: false,
                isLoading: false,
                error: null,
            });

            const config = {
                headers: {},
                url: '/api/test',
            } as unknown as InternalAxiosRequestConfig;

            const result = await requestInterceptor!(config);
            expect(result).toBeDefined();
        });

        it('should preserve existing headers in config', async () => {
            expect(requestInterceptor).not.toBeNull();
            mockGetApiHeaders.mockReturnValue({ 'Content-Type': 'application/json' });
            mockGetAuthHeaders.mockReturnValue({} as any);

            const config = {
                headers: { 'X-Custom-Header': 'custom-value' },
                url: '/api/test',
            } as unknown as InternalAxiosRequestConfig;

            const result = await requestInterceptor!(config);
            expect(result.headers['X-Custom-Header']).toBe('custom-value');
            expect(result.headers['Content-Type']).toBe('application/json');
        });
    });

    describe('response interceptor', () => {
        beforeEach(async () => {
            await import('../../services/HttpClient');
        });

        it('should pass through successful responses', () => {
            expect(responseSuccessInterceptor).not.toBeNull();
            const response = { status: 200, data: { result: 'ok' } };
            const result = responseSuccessInterceptor!(response);
            expect(result).toBe(response);
        });

        it('should call logout on 401 error and reject', async () => {
            expect(responseErrorInterceptor).not.toBeNull();
            mockLogout.mockResolvedValue(undefined);

            const error = {
                response: { status: 401 },
                message: 'Unauthorized',
            } as AxiosError;

            await expect(responseErrorInterceptor!(error)).rejects.toBe(error);
            expect(mockLogout).toHaveBeenCalledTimes(1);
        });

        it('should NOT call logout on non-401 errors', async () => {
            expect(responseErrorInterceptor).not.toBeNull();

            const error = {
                response: { status: 500 },
                message: 'Internal Server Error',
            } as AxiosError;

            await expect(responseErrorInterceptor!(error)).rejects.toBe(error);
            expect(mockLogout).not.toHaveBeenCalled();
        });

        it('should NOT call logout on 403 errors', async () => {
            expect(responseErrorInterceptor).not.toBeNull();

            const error = {
                response: { status: 403 },
                message: 'Forbidden',
            } as AxiosError;

            await expect(responseErrorInterceptor!(error)).rejects.toBe(error);
            expect(mockLogout).not.toHaveBeenCalled();
        });

        it('should handle 401 error even if logout throws', async () => {
            expect(responseErrorInterceptor).not.toBeNull();
            mockLogout.mockRejectedValue(new Error('Logout failed'));

            const error = {
                response: { status: 401 },
                message: 'Unauthorized',
            } as AxiosError;

            await expect(responseErrorInterceptor!(error)).rejects.toBe(error);
            expect(mockLogout).toHaveBeenCalledTimes(1);
        });

        it('should handle errors without response object', async () => {
            expect(responseErrorInterceptor).not.toBeNull();

            const error = {
                response: undefined,
                message: 'Network Error',
            } as unknown as AxiosError;

            await expect(responseErrorInterceptor!(error)).rejects.toBe(error);
            expect(mockLogout).not.toHaveBeenCalled();
        });
    });
});
