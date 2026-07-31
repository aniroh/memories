import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Local development uses the Angular proxy (`/api`). Production builds swap in
 * `environment.prod.ts`, which points at the deployed Render API URL.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  factory: () => environment.apiBaseUrl,
});
