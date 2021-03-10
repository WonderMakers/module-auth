### Install
    npm i git+https://git.hzberg.com/modules/auth#1.0.3
    
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
        
        api: {
          socialUrl: `/user/auth/client-url/%{social}?redirect_uri=%{redirect}`,
          socialToken: `/user/auth%{search}&authclient=%{social}&redirect_uri=%{redirect}`,
          refreshToken: '/user/auth/refresh-token',
          logout: '/user/auth/logout'
        }
    },
    
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

