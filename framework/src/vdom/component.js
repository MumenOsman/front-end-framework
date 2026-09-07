/**
 * Reusable Component Architecture.
 * Provides a base Component contract for modular, stateful UI elements.
 */

export class Component {
  constructor(props = {}) {
    this.props = props;
    this.state = {};
    this._vnode = null;
    this._app = null;
  }

  setState(updater) {
    const nextState = typeof updater === 'function' ? updater(this.state) : updater;
    this.state = { ...this.state, ...nextState };
    if (this._app) {
      this._app.scheduleUpdate();
    }
  }

  // Lifecycle hooks
  onMount() {}
  onUpdate() {}
  onDestroy() {}

  render() {
    throw new Error('Component must implement render()');
  }
}

/**
 * Helper to define functional components with default props.
 */
export function defineComponent(renderFn) {
  return function (props = {}, children = []) {
    return renderFn(props, children);
  };
}
