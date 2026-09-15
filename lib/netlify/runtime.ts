export function isNetlifyProduction() {
  return process.env.CONTEXT === 'production';
}

export function isNetlifyRuntime() {
  return Boolean(process.env.NETLIFY || process.env.CONTEXT || process.env.DEPLOY_ID);
}
