/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare namespace NodeJS {
  export interface ProcessEnv {
    APP_ENV: string;
    API_URL: string;
    API_REGION: string;
    APPSYNC_EXPORTS: string;
    COGNITO_EXPORTS: string;
    BUILD_VERSION: string;
  }
}
