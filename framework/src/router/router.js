/**
 * Client-Side SPA Router.
 * Supports dynamic path parameters (:id), programmatic navigation,
 * query string parsing, and history/hash modes for seamless URL-driven state.
 */

export function createRouter({ routes = [], mode = 'hash' } = {}) {
  const subscribers = new Set();
  let currentRoute = null;

  // Compile routes into matchable patterns
  const compiledRoutes = routes.map(route => {
    const paramNames = [];
    const patternStr = route.path
      .replace(/\/+$/, '')
      .replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      });

    const regex = new RegExp(`^${patternStr || '/'}$`);
    return {
      ...route,
      regex,
      paramNames
    };
  });

  function parseQuery(queryString) {
    const query = {};
    if (!queryString) return query;
    const pairs = (queryString.startsWith('?') ? queryString.slice(1) : queryString).split('&');
    for (const pair of pairs) {
      if (!pair) continue;
      const [key, value] = pair.split('=');
      query[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
    return query;
  }

  function matchRoute(pathWithQuery) {
    const [pathname, queryString] = pathWithQuery.split('?');
    const cleanPath = pathname.replace(/\/+$/, '') || '/';
    const query = parseQuery(queryString);

    for (const route of compiledRoutes) {
      const match = cleanPath.match(route.regex);
      if (match) {
        const params = {};
        for (let i = 0; i < route.paramNames.length; i++) {
          params[route.paramNames[i]] = decodeURIComponent(match[i + 1]);
        }
        return {
          path: cleanPath,
          fullPath: pathWithQuery,
          params,
          query,
          component: route.component,
          title: route.title || ''
        };
      }
    }

    // Default 404 or fallback
    return {
      path: cleanPath,
      fullPath: pathWithQuery,
      params: {},
      query,
      component: null,
      title: 'Not Found'
    };
  }

  function getPathFromLocation() {
    if (typeof window === 'undefined') return '/';
    if (mode === 'hash') {
      const hash = window.location.hash.slice(1);
      return hash.startsWith('/') ? hash : `/${hash}`;
    }
    return window.location.pathname + window.location.search;
  }

  function updateRoute(path, shouldPush = true) {
    currentRoute = matchRoute(path);

    if (typeof window !== 'undefined') {
      if (currentRoute.title) {
        document.title = currentRoute.title;
      }

      if (shouldPush) {
        if (mode === 'hash') {
          window.location.hash = currentRoute.fullPath;
        } else {
          window.history.pushState({}, currentRoute.title, currentRoute.fullPath);
        }
      }
    }

    for (const listener of subscribers) {
      try {
        listener(currentRoute);
      } catch (err) {
        console.error('[dot-js router] Error in subscriber listener:', err);
      }
    }
  }

  function navigate(path) {
    const target = path.startsWith('/') ? path : `/${path}`;
    updateRoute(target, true);
  }

  function init() {
    if (typeof window === 'undefined') return;

    if (mode === 'hash') {
      if (!window.location.hash) {
        window.location.hash = '#/';
      }
      window.addEventListener('hashchange', () => {
        updateRoute(getPathFromLocation(), false);
      });
    } else {
      window.addEventListener('popstate', () => {
        updateRoute(getPathFromLocation(), false);
      });
    }

    updateRoute(getPathFromLocation(), false);
  }

  function subscribe(listener) {
    subscribers.add(listener);
    if (currentRoute) {
      listener(currentRoute);
    }
    return function unsubscribe() {
      subscribers.delete(listener);
    };
  }

  return {
    init,
    navigate,
    getCurrentRoute: () => currentRoute,
    subscribe
  };
}
