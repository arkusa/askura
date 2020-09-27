const webSafeties = [
  { text: 'CSRF', link: '/safety/web/csrf' },
  { text: 'XSS', link: '/safety/web/xss' },
];

const http = [
  { text: 'COOKIE', link: '/net/http/cookie' },
];

module.exports = [
  { text: 'HTTP', items: http },
  { text: 'web安全', items: webSafeties },
];
