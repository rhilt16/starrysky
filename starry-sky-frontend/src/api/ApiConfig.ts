export interface ApiConfig {
  baseURL: string;
  token?: string;
  refreshToken?: string;
  timeout?: number;

  refreshEndpoint?: string; // e.g. "/auth/refresh"
}
