import { Auth } from './class'

export default ({ app }, inject) => {
  const options = JSON.parse(`<%= JSON.stringify(options).replace(/^"/, "'").replace(/"$/, "'") %>`)
  const auth = new Auth(options)
  const isDebug = options.debug
  let ready = false
  // const isDev = app.context.isDev

  app.router.beforeEach(async (to, from, next) => {
    if (process.server) return next()
    if (isDebug) {
      console.log('beforeEnter', to)
    }
    if (!ready) {
      const result = await auth.loginSocialComplete()
      await auth.getToken()
      ready = true
      if (result.redirect) {
        if (isDebug) {
          console.log('redirect', result.redirect)
        }
        return next(result.redirect)
      }
    }

    next()
  })

  app.router.beforeResolve(async (to, from, next) => {
    if (process.server) return next()
    if (isDebug) {
      console.log('beforeResolve', to)
    }
    const component = to.matched[0].components.default
    if (component.extendOptions) {
      const authOptions = component.extendOptions.auth
      if (authOptions) {
        const token = await auth.getToken()
        const redirect = typeof authOptions === 'object' ? authOptions.redirect : auth.config.redirect

        if (!token) {
          if (isDebug) {
            console.log('token', token)
            console.log('redirect', redirect)
          }
          return next(redirect)
        }
      }
    } else {
      if (isDebug) {
        console.log('none extendOptions', component)
      }
    }

    next()
  })

  inject('auth', auth)
}
