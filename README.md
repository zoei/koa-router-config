### koa-router-config

> Using [koa-router](github.com/alexmingoia/koa-router) with configure.

* Support controller path config.
* Multi http method.
* Response redirect.
* Multiple route middleware.
* Nestable routers.
* ES7 async/await support.

## Installation

Install using [npm](https://www.npmjs.org/):

```sh
npm install koa-router-config
```

## API Reference
* koa-router-config
    * ConfigRouter
        * new ConfigRouter([opts])
        * _instance_
            * .router ⇒ <code>router</code>
            * .configRoute(configOpts, routesConfig) ⇒ <code>router</code>


### ConfigRouter ⏏
**Kind**: Exported class

### rotuer
**Kind**: Exported [koa-router](github.com/alexmingoia/koa-router) instance

### config(configOpts, routesConfig)
  * configOpts ⇒ <code>Object</code>
    * controllerRoot: String, path of controller root.
  * routesConfig ⇒ <code>Array or Object</code>
    * Array: {RouteConfig, ...}
    * Object: {url1: RouteConfig, url2: RouteConfig, ...}
  * RouteConfig ⇒ <code>any</code>
    * String: Controller name or redirect url.
    * Array: [middleware1, middleware2, ..., middlewaren, controller]
    * Object: { url, method, middlewares, controller, redirect }

### Examples

directories
```
├── controllers/
│   ├── home.js
│   ├── api/
│       ├── user.js
├── routes/
│   ├── api.js
│   ├── index.js
├── server.js
```

controllers/home.js
```javascript
  module.exports = {
    get: ctx => {
      ctx.render('home')
    }
  }
```

controllers/api/user.js
```javascript
  module.exports = {
    get: ctx => {
      ctx.body = { id: ctx.params.id }
    }
  }
```

routes/index.js
```javascript
const ConfigRouter = require('koa-router-config').ConfigRouter;
const configRoute = new ConfigRouter();
configRouter.config(
  { controllerRoot: path.resolve(__dirname, '../controllers') },
  {
    '/': 'home.get',                                       // default method: 'GET'
    'get /github': 'http://www.github.com',                // response redirect
    'get|post /logHeader': ctx => ctx.body = ctx.headers,  // multi method
    '/api': require('./api')                               // nestable router
  }
);
module.exports = configRouter.router;                      // export koa-router instance
```

routes/api.js
```javascript
const ConfigRouter = require('koa-router-config').ConfigRouter;
const configRouter = new ConfigRouter();
configRouter.config(
  { controllerRoot: path.resolve(__dirname, '../controllers/api') },
  [
    {
      url: '/'
      controller: ctx => ctx.body = 'Hello API!',
    },
    {
      url: '/users/:id',                         // support http methods: 'GET' & 'POST',
      middlewares: [ctx => console.log('get user:' + ctx.params.id)],
      controller: 'user.get'
    },
    {
      url: 'post /auth',                        // support http methods: 'GET' & 'POST'
      redirect: 'https://github.com/login'
    }
  ]
);
module.exports = configRouter.router;           // export koa-router instance
```

server.js
```javascript
const Koa = require('koa')
const app = new Koa()
const router = require('./routes')
...
app.use(router.routes())
app.use(router.allowedMethods())
...
```