// Deno types for edge functions
// This file provides type definitions for Deno globals in VS Code

declare global {
  namespace Deno {
    export const env: {
      get(key: string): string | undefined;
    };
  }
}

export {};
