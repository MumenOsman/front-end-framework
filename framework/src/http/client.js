/**
 * Built-in HTTP Client Abstraction.
 * Provides unified GET, POST, PUT, DELETE operations, automatic JSON
 * serialization/parsing, interceptors, and mock adapter integration.
 */

export class HttpClient {
  constructor({ baseUrl = '', defaultHeaders = {}, mockHandler = null } = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...defaultHeaders
    };
    this.mockHandler = mockHandler;
    this.interceptors = {
      request: [],
      response: []
    };
  }

  useRequestInterceptor(fn) {
    this.interceptors.request.push(fn);
  }

  useResponseInterceptor(fn) {
    this.interceptors.response.push(fn);
  }

  async request(endpoint, options = {}) {
    let url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    let config = {
      method: (options.method || 'GET').toUpperCase(),
      headers: { ...this.defaultHeaders, ...(options.headers || {}) },
      ...options
    };

    // Serialize JSON body if an object is passed
    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    // Apply request interceptors
    for (const interceptor of this.interceptors.request) {
      config = (await interceptor(config)) || config;
    }

    // If a mockHandler is configured, use it instead of network fetch
    if (this.mockHandler) {
      const mockResult = await this.mockHandler(url, config);
      if (mockResult !== undefined) {
        return mockResult;
      }
    }

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type') || '';
      let data = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      let result = {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        data,
        headers: response.headers,
        error: response.ok ? null : (data?.message || response.statusText)
      };

      // Apply response interceptors
      for (const interceptor of this.interceptors.response) {
        result = (await interceptor(result)) || result;
      }

      return result;
    } catch (err) {
      return {
        ok: false,
        status: 0,
        statusText: 'Network Error',
        data: null,
        headers: null,
        error: err.message || 'Network request failed'
      };
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const http = new HttpClient();

export function createHttpClient(options) {
  return new HttpClient(options);
}
