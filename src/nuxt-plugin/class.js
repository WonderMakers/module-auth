import { LocalStorage } from '../../utils/local-storage.js'

export class Auth {
  constructor (config) {
    this.config = config
    this.token = null
    this.LOCALSTORAGE_TOKEN_KEY = `${config.namespace}:token`
    this.LOCALSTORAGE_LOGIN_KEY = `${config.namespace}:login`
  }

  getRedirectUri () {
    return location.origin + '/'
  }

  login ({ social, redirect }) {
    if (social && this.config.socials.includes(social)) {
      return this.loginBySocial({ social, redirect })
    } else {
      return Promise.reject(Error('Login with such params is not supported'))
    }
  }

  async loginBySocial ({ social, open }) {
    const redirect = this.getRedirectUri()
    open = open || location.pathname
    LocalStorage.set(this.LOCALSTORAGE_LOGIN_KEY, { social, redirect, open })
    const url = await this.getSocialUrl({ social, redirect })
    if (this.config.debug) {
      console.log('loginBySocial redirect to', url)
    }
    location.href = url.replace(/^"/, '').replace(/"$/, '')
  }

  getSocialUrl ({ social, redirect }) {
    return this.request({
      path: this.createPath(this.config.api.socialUrl, { social, redirect })
    })
  }

  async getTokenBySocial ({ social, redirect, search = '?' }) {
    if (this.config.debug) {
      console.log('getTokenBySocial: ', social, search)
    }
    try {
      const path = this.createPath(this.config.api.socialToken, { social, search, redirect })
      const result = await this.request({ path })
      return JSON.parse(result)
    } catch (e) {
      if (this.config.debug) {
        console.log('Error getTokenBySocial', e)
      }
      return null
    }
  }

  async loginSocialComplete () {
    const login = LocalStorage.get(this.LOCALSTORAGE_LOGIN_KEY)
    const result = { redirect: false }

    if (login && login.social) {
      LocalStorage.remove(this.LOCALSTORAGE_LOGIN_KEY)
      const token = await this.getTokenBySocial({
        social: login.social,
        search: location.search,
        redirect: login.redirect
      })
      if (token) {
        this.setToken(token)
        result.redirect = login.open
      }
    }
    return result
  }

  async getToken () {
    const token = this.token || LocalStorage.get(this.LOCALSTORAGE_TOKEN_KEY)
    if (token && token.expires_in) {
      const now = Date.now()
      const expires = token.expires_in * 1000
      if (expires < now) {
        return await this.refreshToken(token)
      } else {
        this.token = token
        return token
      }
    } else {
      return null
    }
  }

  async refreshToken (token) {
    try {
      const headers = await this.getHeaders(token)
      const result = await this.request({
        path: this.createPath(this.config.api.refreshToken),
        method: 'POST',
        params: { refresh_token: token.refresh_token }
      }, {
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          ...headers
        }
      })
      const newToken = JSON.parse(result)
      if (this.config.debug) {
        console.log('refreshToken token: ', newToken)
      }
      if (newToken) {
        this.setToken(newToken)
        return newToken
      }
    } catch (e) {
      if (this.config.debug) {
        console.log('Error refreshToken: ', e)
      }
      this.removeToken()
      return null
    }
  }

  async getHeaders (token) {
    token = token|| await this.getToken()
    return token ? { Authorization: `Bearer ${token.access_token}` } : {}
  }

  setToken (token) {
    LocalStorage.set(this.LOCALSTORAGE_TOKEN_KEY, token)
    this.token = token
    if (this.config.debug) {
      console.log('setToken', token)
    }
  }

  removeToken () {
    LocalStorage.remove(this.LOCALSTORAGE_TOKEN_KEY)
    this.token = null
  }

  createPath (path, params = {}) {
    let result = path
    Object.keys(params).forEach(key => {
      result = result.replace(`%{${key}}`, params[key])
    })
    return result
  }

  async logout () {
    try {
      const token = await this.getToken()
      const headers = await this.getHeaders(token)

      await this.request({
        path: this.createPath(this.config.api.logout),
        method: 'POST',
        params: { refresh_token: token.refresh_token }
      }, {
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          ...headers
        }
      })
    } finally {
      this.removeToken()
    }
  }

  request ({ method = 'GET', path = '/', params = {} }, options = {}) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest()
      const url = this.config.endpoint + path
      request.open(method, url, true)

      if (options.headers) {
        for (const header in options.headers) {
          request.setRequestHeader(header, options.headers[header])
        }
      }

      request.onload = () => resolve(request.response)
      request.onerror = () => reject(request.response)

      if (method === 'POST') {
        request.send(JSON.stringify(params))
      } else {
        request.send()
      }
    })
  }
}
