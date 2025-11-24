import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import type { ApiConfig } from "./ApiConfig";
import { TokenStore } from "./TokenStore";

export class ApiClient {
  private axiosInstance: AxiosInstance;
  private tokenStore: TokenStore;

  // For cancellation (per URL)
  private abortControllers = new Map<string, AbortController>();

  // For refresh token flow
  private isRefreshing = false;
  private refreshQueue: ((token: string) => void)[] = [];

  constructor(config: ApiConfig) {
    this.tokenStore = new TokenStore(config.token, config.refreshToken);

    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout ?? 100_000,
    });

    // REQUEST INTERCEPTOR
    this.axiosInstance.interceptors.request.use(req => {
      // Attach token
      if (this.tokenStore.accessToken) {
        req.headers = req.headers || {};
        req.headers.Authorization = `Bearer ${this.tokenStore.accessToken}`;
      }
      return req;
    });

    // RESPONSE INTERCEPTOR (refresh token logic)
    this.axiosInstance.interceptors.response.use(
      res => res,
      async error => {
        const originalRequest = error.config;

        // If unauthorized, try refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          return this.handleRefresh(error, originalRequest, config);
        }

        throw error;
      }
    );
  }

  // ---- TOKEN REFRESH LOGIC ----
  private async handleRefresh(error: any, originalRequest: any, config: ApiConfig) {
    if (!this.tokenStore.refreshToken) {
      throw error;
    }

    // Already refreshing → push request to queue 
    if (this.isRefreshing) {
      return new Promise(resolve => {
        this.refreshQueue.push((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(this.axiosInstance(originalRequest));
        });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await axios.post(
        config.baseURL + (config.refreshEndpoint || "/auth/refresh"),
        { refreshToken: this.tokenStore.refreshToken }
      );

      const newToken = response.data.token;

      // Store updated access token
      this.tokenStore.accessToken = newToken;

      // Retry all queued requests waiting for refresh
      this.refreshQueue.forEach(cb => cb(newToken));
      this.refreshQueue = [];
      this.isRefreshing = false;

      // Retry original request
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return this.axiosInstance(originalRequest);

    } catch (refreshError) {
      this.isRefreshing = false;
      this.refreshQueue = [];
      throw refreshError;
    }
  }

  // ---- AUTO-CANCEL GET REQUESTS ----
  private createAbortSignal(url: string): AbortSignal {
    if (this.abortControllers.has(url)) {
      // Cancel previous request for same endpoint
      this.abortControllers.get(url)!.abort();
    }

    const controller = new AbortController();
    this.abortControllers.set(url, controller);
    return controller.signal;
  }

  // ---- GET ----
  async get<T>(url: string, options?: AxiosRequestConfig): Promise<T> {
    const signal = this.createAbortSignal(url);

    const res = await this.axiosInstance.get<T>(url, {
      ...options,
      signal,
    });

    return res.data;
  }
}
