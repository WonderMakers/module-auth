### Install
    npm i git+https://git.hzberg.com/modules/auth#1.1.0
    
### Setup
```nuxt.config.js```

    buildModules: [
        'auth'
    ],
    
```nuxt.config.js```

    auth: {
        namespace: 'Auth',
        
        // Socials list ['vkontakte', 'google', ...]
        socials: [],
        
        // API endpoint
        endpoint: '',
        
        // Default redirect URL if not autorized
        redirect: '/',
        
        // Debug mode
        debug: false,
        
        // Will pass a fingerprinting pin when receiving a token
        useFingerprint: false,
        
        api: {
            socialUrl: `/user/auth/client-url/%{social}`,
            socialToken: `/user/auth`,
            refreshToken: '/user/auth/refresh-token',
            logout: '/user/auth/logout'
        }
    },
    
### Add request interceptor

    this.$auth.addRequestInterceptor(async ({ name, method, url, params, options }) => {
        return { name, method, url, params, options }
    })
    
### Usage

    this.$auth.login({ social, redirect })
    await this.$auth.logout()
    await this.$auth.getHeaders()
    await this.$auth.getToken()
    
```page.vue```

    auth: {
      redirect: '/'
    },
    
    or
    
    auth: true

