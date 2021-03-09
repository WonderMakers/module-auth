import { Auth } from './class'

export default ({ app }, inject) => {
  const options = JSON.parse(`<%= JSON.stringify(options).replace(/^"/, "'").replace(/"$/, "'") %>`)
  const auth = new Auth(options)
  let ready = false
  // const isDev = app.context.isDev

  app.router.beforeEach(async (to, from, next) => {
    if (!ready) {
      const result = await auth.loginSocialComplete()
      await auth.getToken()
      ready = true
      if (result.redirect) {
        return next(result.redirect)
      }
    }
    next()
  })

  inject('auth', auth)
}
