'use strict';

const HttpsProxyAgent = require('https-proxy-agent');

/*
 * API proxy configuration.
 * This allows you to proxy HTTP request like `http.get('/api/stuff')` to another server/port.
 * This is especially useful during app development to avoid CORS issues while running a local server.
 * For more details and options, see https://angular.io/guide/build#using-corporate-proxy
 */
const proxyConfig = [
  {
    context: '/rest-z4d/',
    target: 'http://172.22.194.45:9440',
    secure: false
  }
];

/*
 * Configures a corporate proxy agent for the API proxy if needed.
 */
function setupForCorporateProxy(proxyConfig) {
  if (!Array.isArray(proxyConfig)) {
    proxyConfig = [proxyConfig];
  }

  return proxyConfig;
}

module.exports = setupForCorporateProxy(proxyConfig);
