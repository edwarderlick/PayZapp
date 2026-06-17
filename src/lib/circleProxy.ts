// Intercept fetch calls to Circle APIs and rewrite them through the Vite dev proxy.
// This must be imported before any Circle SDK code runs.
// Solves CORS errors AND the new URL() absolute-URL requirement in Circle SDKs.
const PROXY_MAP: [string, string][] = [
  ['https://gateway-api-testnet.circle.com', '/proxy/gateway-testnet'],
  ['https://gateway-api.circle.com', '/proxy/gateway-api'],
  ['https://iris-api-sandbox.circle.com', '/proxy/iris-sandbox'],
  ['https://iris-api.circle.com', '/proxy/iris-api'],
  ['https://api.circle.com', '/proxy/circle-api'],
]

const _fetch = window.fetch.bind(window)

window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const raw =
    typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.href
      : (input as Request).url

  for (const [origin, proxy] of PROXY_MAP) {
    if (raw.startsWith(origin)) {
      const rewritten = raw.replace(origin, proxy)
      let newInput: RequestInfo | URL
      if (typeof input === 'string') {
        newInput = rewritten
      } else if (input instanceof URL) {
        newInput = new URL(rewritten, window.location.origin)
      } else {
        newInput = new Request(rewritten, (input as Request).clone())
      }
      return _fetch(newInput, init)
    }
  }

  return _fetch(input, init)
}
