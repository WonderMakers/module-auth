import Fingerprint2 from 'fingerprintjs2'
import { LocalStorage } from '../../utils/local-storage.js'

const finderprintOptios = { excludes: {
    userAgent: true,
    language: true,
    availableScreenResolution: true,
    plugins: true,
    webgl: true,
    canvas: true,
    audio: true,
    enumerateDevices: true,
    webglVendorAndRenderer: true
  }
}

export class Auth {
  constructor (options) {
    this.options = options
    this.token = null
    this.LOCALSTORAGE_TOKEN_KEY = `${options.namespace}:token`
    this.LOCALSTORAGE_LOGIN_KEY = `${options.namespace}:login`
    this.fingerprint = ''
    this.requestInterceptors = []
  }

  getRedirectUri () {
    return location.origin + this.options.callbackPath
  }

  async getFingerPrint () {
    if (this.fingerprint) {
      return this.fingerprint
    } else {
      return new Promise((resolve) => {
        Fingerprint2.get(finderprintOptios, (components) => {
          const values = components.map(component => component.value)
          this.fingerprint = Fingerprint2.x64hash128(values.join(''), 31)
          resolve(this.fingerprint)
        })
      })
    }
  }

  login ({ social, redirect }) {
    if (this.options.debug) {
      console.log('login', social, redirect)
    }
    if (social && this.options.socials.includes(social)) {
      return this.loginBySocial({ social, open: redirect })
    } else {
      return Promise.reject(Error('Login with such params is not supported'))
    }
  }

  async loginBySocial ({ social, open }) {
    const redirect = this.getRedirectUri()
    open = open || location.pathname
    LocalStorage.set(this.LOCALSTORAGE_LOGIN_KEY, { social, redirect, open })
    const url = await this.getSocialUrl({ social, redirect_uri: redirect })
    if (this.options.debug) {
      console.log('loginBySocial redirect to', url)
    }
    location.href = url.replace(/^"/, '').replace(/"$/, '')
  }

  getSocialUrl ({ social, redirect_uri }) {
    const params = { social, redirect_uri }
    const path = this.transformPath(this.options.api.socialUrl, params)
    return this.request('getSocialUrl', { path, params })
  }

  async getTokenBySocial ({ social, redirect, search = '?' }) {
    if (this.options.debug) {
      console.log('getTokenBySocial: ', social, search)
    }
    try {
      const params = this.splitSearchString(search)
      params.authclient = social
      params.redirect_uri = redirect

      if (this.options.useFingerprint) {
        params.fingerprint = await this.getFingerPrint()
      }

      const path = this.transformPath(this.options.api.socialToken, params)
      const result = await this.request('getTokenBySocial', { path, params })
      return JSON.parse(result)
    } catch (e) {
      if (this.options.debug) {
        console.log('Error getTokenBySocial', e)
      }
      return null
    }
  }

  splitSearchString (searchString = '?') {
    return searchString.replace(/^\?/, '').split('&').reduce((res, item) => {
      res[item.split('=')[0]] = item.split('=')[1]
      return res
    }, {})
  }

  toBodyString (params = {}) {
    return Object.keys(params).map((key) => `${key}=${params[key]}`).join('&')
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
      if (token && token.access_token) {
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
      const refresh_token = token.refresh_token
      const params = { refresh_token }
      const path = this.transformPath(this.options.api.refreshToken, params)
      const result = await this.request('refreshToken', { path, params, method: 'POST' }, {
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          ...headers
        }
      })
      const newToken = JSON.parse(result)
      if (this.options.debug) {
        console.log('refreshToken token: ', newToken)
      }
      if (newToken) {
        this.setToken(newToken)
        return newToken
      }
    } catch (e) {
      if (this.options.debug) {
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
    if (this.options.debug) {
      console.log('setToken', token)
    }
  }

  removeToken () {
    LocalStorage.remove(this.LOCALSTORAGE_TOKEN_KEY)
    this.token = null
  }

  transformPath (path, params = {}) {
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
      const refresh_token = token.refresh_token
      const params = { refresh_token }
      const path = this.transformPath(this.options.api.logout, params)
      await this.request('logout', { path, params, method: 'POST' }, {
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          ...headers
        }
      })
    } finally {
      this.removeToken()
    }
  }

  request (name, { method = 'GET', path = '/', params = {} }, options = {}) {
    return new Promise(async (resolve, reject) => {
      const request = new XMLHttpRequest()
      const url = this.options.endpoint + path
      const requestData = { name, method, url, params, options }
      let data

      await this.transformRequestData(requestData)

      request.onload = () => resolve(request.response)
      request.onerror = () => reject(request.response)

      if (method === 'POST') {
        request.open(requestData.method, requestData.url, true)
        data = JSON.stringify(params)
      } else {
        const bodyString = this.toBodyString(params)
        const url = requestData.url + (bodyString ? '?' + bodyString : '')
        request.open(requestData.method, url, true)
      }

      if (requestData.options && requestData.options.headers) {
        for (const header in requestData.options.headers) {
          request.setRequestHeader(header, requestData.options.headers[header])
        }
      }
      request.send(data)
    })
  }

  async transformRequestData (requestData) {
    const iterator = this.requestInterceptors.entries()
    let value = iterator.next().value

    while (value) {
      const interceptorFn = value[1]
      requestData = await interceptorFn(requestData)
      value = iterator.next().value
    }

    return requestData
  }

  async addRequestInterceptor (fn) {
    this.requestInterceptors.push(fn)
  }
}
