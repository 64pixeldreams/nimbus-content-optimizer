/**
 * Simple router for Cloudflare Workers
 * Handles route matching and middleware execution
 */

export class Router {
  constructor() {
    this.routes = [];
  }

  /**
   * Register GET route
   */
  get(path, ...handlers) {
    this.routes.push({ method: 'GET', path, handlers });
  }

  /**
   * Register POST route
   */
  post(path, ...handlers) {
    this.routes.push({ method: 'POST', path, handlers });
  }

  /**
   * Register PATCH route
   */
  patch(path, ...handlers) {
    this.routes.push({ method: 'PATCH', path, handlers });
  }

  /**
   * Register DELETE route
   */
  delete(path, ...handlers) {
    this.routes.push({ method: 'DELETE', path, handlers });
  }

  /**
   * Handle incoming request
   */
  async handle(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Find matching route
    for (const route of this.routes) {
      if (route.method !== request.method) continue;
      
      const params = this.matchPath(route.path, path);
      if (params) {
        request.params = params;
        return this.runHandlers(route.handlers, request, env, ctx);
      }
    }
    
    // No route found
    return new Response(JSON.stringify({ 
      error: 'Not Found',
      path: path,
      method: request.method 
    }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Match path pattern with actual path
   * @returns {object|null} Params object or null if no match
   */
  matchPath(pattern, path) {
    // Simple pattern matching with :param support
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);
    
    if (patternParts.length !== pathParts.length) {
      return null;
    }
    
    const params = {};
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];
      
      if (patternPart.startsWith(':')) {
        // Parameter
        const paramName = patternPart.slice(1);
        params[paramName] = pathPart;
      } else if (patternPart !== pathPart) {
        // No match
        return null;
      }
    }
    
    return params;
  }

  /**
   * Run handlers in sequence
   */
  async runHandlers(handlers, request, env, ctx) {
    // Single handler - just run it
    if (handlers.length === 1) {
      return handlers[0](request, env, ctx);
    }
    
    // Multiple handlers - middleware expects to call the final handler
    const finalHandler = handlers[handlers.length - 1];
    
    // Run middleware with final handler
    for (let i = 0; i < handlers.length - 1; i++) {
      const middleware = handlers[i];
      const result = await middleware(request, env, ctx, finalHandler);
      
      // Middleware will either return response or call finalHandler
      if (result instanceof Response) {
        return result;
      }
    }
  }
}
