module.exports = {
  namespace: 'Auth',
  socials: [],
  endpoint: '',
  redirect: '/',
  debug: false,
  api: {
    socialUrl: `/user/auth/client-url/%{social}?redirect_uri=%{redirect}`,
    socialToken: `/user/auth%{search}&authclient=%{social}&redirect_uri=%{redirect}`,
    refreshToken: '/user/auth/refresh-token',
    logout: '/user/auth/logout'
  }
}
