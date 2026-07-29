import { InjectionToken } from '@angular/core';

/**
 * Local development uses the Angular proxy. Cloudflare Pages can override
 * this token in a deployment-specific provider once the Render API URL exists.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  factory: () => '/api',
});
