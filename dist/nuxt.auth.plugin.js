(()=>{"use strict";var e={d:(t,o)=>{for(var r in o)e.o(o,r)&&!e.o(t,r)&&Object.defineProperty(t,r,{enumerable:!0,get:o[r]})},o:(e,t)=>Object.prototype.hasOwnProperty.call(e,t)},t={};e.d(t,{default:()=>n});const o={};function r(){throw new Error("Can't create instance of static class LocalStorage")}o.lacalStoragePrefix="storage:",o.parseData=function(e){try{return JSON.parse(e)}catch(t){return e}},o.stringifyData=function(e){return JSON.stringify({date:(new Date).toString(),time:Date.now(),data:e})},r.isSupported=function(){return"undefined"!=typeof Storage},r.get=function(e,t){if(this.isSupported()){let r=o.parseData(localStorage.getItem((t?"":o.lacalStoragePrefix)+e));return r&&(r.data||null)}return null},r.set=function(e,t){return this.isSupported()&&localStorage.setItem(o.lacalStoragePrefix+e,o.stringifyData(t)),this},r.remove=function(e){return this.isSupported()&&localStorage.removeItem(o.lacalStoragePrefix+e),this};class i{constructor(e){this.config=e,this.token=null,this.LOCALSTORAGE_TOKEN_KEY=`${e.namespace}:token`,this.LOCALSTORAGE_LOGIN_KEY=`${e.namespace}:login`}getRedirectUri(){return location.origin+"/"}login({social:e,redirect:t}){return e&&this.config.socials.includes(e)?this.loginBySocial({social:e,redirect:t}):Promise.reject(Error("Login with such params is not supported"))}async loginBySocial({social:e,open:t}){const o=this.getRedirectUri();t=t||location.pathname,r.set(this.LOCALSTORAGE_LOGIN_KEY,{social:e,redirect:o,open:t});const i=await this.getSocialUrl({social:e,redirect:o});this.config.debug&&console.log("loginBySocial redirect to",i),location.href=i.replace(/^"/,"").replace(/"$/,"")}getSocialUrl({social:e,redirect:t}){return this.request({path:this.createPath(this.config.api.socialUrl,{social:e,redirect:t})})}async getTokenBySocial({social:e,redirect:t,search:o="?"}){this.config.debug&&console.log("getTokenBySocial: ",e,o);try{const r=this.createPath(this.config.api.socialToken,{social:e,search:o,redirect:t}),i=await this.request({path:r});return JSON.parse(i)}catch(e){return this.config.debug&&console.log("Error getTokenBySocial",e),null}}async loginSocialComplete(){const e=r.get(this.LOCALSTORAGE_LOGIN_KEY),t={redirect:!1};if(e&&e.social){r.remove(this.LOCALSTORAGE_LOGIN_KEY);const o=await this.getTokenBySocial({social:e.social,search:location.search,redirect:e.redirect});o&&(this.setToken(o),t.redirect=e.open)}return t}async getToken(){const e=this.token||r.get(this.LOCALSTORAGE_TOKEN_KEY);if(e&&e.expires_in){const t=Date.now();return 1e3*e.expires_in<t?await this.refreshToken(e):(this.token=e,e)}return null}async refreshToken(e){try{const t=await this.getHeaders(e),o=await this.request({path:this.createPath(this.config.api.refreshToken),method:"POST",params:{refresh_token:e.refresh_token}},{headers:{"Content-Type":"application/json;charset=UTF-8",...t}}),r=JSON.parse(o);if(this.config.debug&&console.log("refreshToken token: ",r),r)return this.setToken(r),r}catch(e){return this.config.debug&&console.log("Error refreshToken: ",e),this.removeToken(),null}}async getHeaders(e){return(e=e||await this.getToken())?{Authorization:`Bearer ${e.access_token}`}:{}}setToken(e){r.set(this.LOCALSTORAGE_TOKEN_KEY,e),this.token=e,this.config.debug&&console.log("setToken",e)}removeToken(){r.remove(this.LOCALSTORAGE_TOKEN_KEY),this.token=null}createPath(e,t={}){let o=e;return Object.keys(t).forEach((e=>{o=o.replace(`%{${e}}`,t[e])})),o}async logout(){try{const e=await this.getToken(),t=await this.getHeaders(e);await this.request({path:this.createPath(this.config.api.logout),method:"POST",params:{refresh_token:e.refresh_token}},{headers:{"Content-Type":"application/json;charset=UTF-8",...t}})}finally{this.removeToken()}}request({method:e="GET",path:t="/",params:o={}},r={}){return new Promise(((i,n)=>{const s=new XMLHttpRequest,a=this.config.endpoint+t;if(s.open(e,a,!0),r.headers)for(const e in r.headers)s.setRequestHeader(e,r.headers[e]);s.onload=()=>i(s.response),s.onerror=()=>n(s.response),"POST"===e?s.send(JSON.stringify(o)):s.send()}))}}const n=({app:e},t)=>{const o=JSON.parse('<%= JSON.stringify(options).replace(/^"/, "\'").replace(/"$/, "\'") %>'),r=new i(o),n=o.debug;let s=!1;e.router.beforeEach((async(e,t,o)=>{if(process.server)return o();if(n&&console.log("beforeEnter",e),!s){const e=await r.loginSocialComplete();if(await r.getToken(),s=!0,e.redirect)return n&&console.log("redirect",e.redirect),o(e.redirect)}o()})),e.router.beforeResolve((async(e,t,o)=>{if(process.server)return o();n&&console.log("beforeResolve",e);const i=e.matched[0].components.default;if(i.extendOptions){const e=i.extendOptions.auth;if(e){const t=await r.getToken(),i="object"==typeof e?e.redirect:r.config.redirect;if(!t)return n&&(console.log("token",t),console.log("redirect",i)),o(i)}}else n&&console.log("none extendOptions",i);o()})),t("auth",r)};module.exports=t.default})();