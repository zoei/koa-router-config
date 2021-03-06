const path = require('path')
const Router = require('koa-router')
const compose = require('koa-compose')

function getController(str, controllerRoot) {
  let [controllerPath, func] = str.split('.')
  let controller = require(path.resolve(controllerRoot, controllerPath))
  function ControllerWrapper(method) {
    const ctrl = controller[func || method] || controller.get || function(){}
    return ctrl.bind(controller)
  }
  return ControllerWrapper
}

function parseConfig(handler, options) {
  if (typeof handler === 'object' && handler instanceof Router) {
    return {
      type: 'sub_route_config',
      router: handler
    }
  } else if (Array.isArray(handler)) {
    const middlewares = handler.slice(0, handler.length - 1);
    return Object.assign({ middlewares }, parseConfig(handler[handler.length - 1], options));
  } else if (typeof handler === 'function') {
    return {
      type: 'controller',
      controller: handler
    }
  } else if (typeof handler=== 'string' && (handler.startsWith('http') || handler.startsWith('/'))) {
    return {
      type: 'redirect',
      redirect: handler
    }
  } else if (typeof handler === 'string') {
    return {
      type: 'controller',
      controller: getController(handler, options.controllerRoot)
    }
  } else if (typeof handler === 'object') {
    if (handler.controller && typeof handler.controller === 'string') handler.controller = getController(handler.controller, options.controllerRoot)
    return Object.assign({
      type: handler.controller ? 'controller' : handler.redirect ? 'redirect' : 'none'
    }, handler)
  }
}

function configRoute(router, config) {
  let { type, method, methods = [method], url, middlewares = [], controller, redirect, router: subRouter } = config
  methods.forEach(method => {
    switch (type) {
      case 'sub_route_config':
        router.use(url, subRouter.routes(), subRouter.allowedMethods())
        break
      case 'redirect':
        router[method](url, (ctx)=>ctx.response.redirect(redirect))
        break
      case 'controller':
        if (controller.name === 'ControllerWrapper') {
          controller = controller(method)
        }
        if (middlewares.length > 0) {
          router[method](url, compose(middlewares), controller)
        } else {
          router[method](url, controller)
        }
        break
      default:
    }
  })
}

function parseRouteConfig(routePath, routeConfig, options) {
  let [methods, url] = routePath.split(' ')
  if (!url) {
    url = methods
    methods = ['get']
  } else {
    methods = methods.split('|')
  }

  let parsedRouteConfig = parseConfig(routeConfig, options)
  return Object.assign(
    {},
    parsedRouteConfig,
    {
      url,
      methods
    }
  )
}

function ConfigRouter(routerOptions = {}) {
  this.router = new Router(routerOptions);
  this.config = function(configOptions = {}, routesConfig) {
    let middlewares = []
    if (arguments.length > 2) {
      let args = Array.prototype.slice.call(arguments);
      configOptions = args[args.length - 2]
      routesConfig = args[args.length - 1]
      middlewares = args.slice(0, args.length - 2);
    }
    var routesConfigArray = []
    if (Array.isArray(routesConfig)) {
      routesConfigArray = routesConfig.map(routeConfig => {
        return parseRouteConfig(routeConfig.url, routeConfig, configOptions)
      })
    } else if (typeof routesConfig === 'object') {
      Object.keys(routesConfig).forEach(url => {
        routesConfigArray.push(parseRouteConfig(url, routesConfig[url], configOptions))
      })
    }
    let router = this.router;
    middlewares.forEach(middleware => {
      router.use(middlewares)
    })

    routesConfigArray.forEach(routeConfig => {
      configRoute(router, routeConfig);
    })
    return this;
  }
}

module.exports = {
  ConfigRouter
}