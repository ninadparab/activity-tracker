// Values injected at build time from GitHub Secrets — never hardcode here
export const API_URL       = import.meta.env.VITE_API_URL
export const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY
export const ACCESS_TOKEN  = import.meta.env.VITE_ACCESS_TOKEN  // sent with every API call
export const APP_PIN       = import.meta.env.VITE_APP_PIN       // family PIN for app access
export const REPO_NAME     = 'activity-tracker'
