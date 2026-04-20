declare global {
  interface Window {
    __env?: {
      API_URL?: string;
      UPLOADS_URL?: string;
    };
  }
}

const runtimeEnv = typeof window !== 'undefined' ? window.__env : undefined;

export const environment = {
  production: true,
  // En producción, el servidor web (nginx/Docker) debe reemplazar estos placeholders.
  apiUrl: runtimeEnv?.API_URL || '',
  uploadsUrl: runtimeEnv?.UPLOADS_URL || '',
  googleClientId: '1075785830924-ivdjd55qiurb5g2etsp36bemn7ge89lt.apps.googleusercontent.com',
};
