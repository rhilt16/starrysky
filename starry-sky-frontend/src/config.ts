import type { ApiConfig } from "./api/ApiConfig";

export const DEFAULT_API_CONFIG: ApiConfig = {
    baseURL: 'http://127.0.0.1:5001',
    token: 'first',
    refreshToken: '1',
    refreshEndpoint: '/auth/refresh'
}