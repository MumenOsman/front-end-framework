/**
 * Virtual DOM element factory (Hyperscript)
 * Creates normalized Virtual DOM nodes (VNodes).
 */

export function h(tag, props = null, ...children) {
  const normalizedProps = props ? { ...props } : {};
  const key = normalizedProps.key !== undefined ? normalizedProps.key : null;
  delete normalizedProps.key;

  const flattenedChildren = [];

  function appendChild(child) {
    if (child === null || child === undefined || child === false) {
      return;
    }
    if (Array.isArray(child)) {
      for (let i = 0; i < child.length; i++) {
        appendChild(child[i]);
      }
    } else if (typeof child === 'object' && child.tag !== undefined) {
      flattenedChildren.push(child);
    } else {
      // Primitive string, number, etc.
      flattenedChildren.push(createTextVNode(child));
    }
  }

  for (let i = 0; i < children.length; i++) {
    appendChild(children[i]);
  }

  return {
    tag,
    props: normalizedProps,
    children: flattenedChildren,
    key,
    el: null,
    isVNode: true
  };
}

export function createTextVNode(text) {
  return {
    tag: '#text',
    text: String(text),
    props: {},
    children: [],
    key: null,
    el: null,
    isVNode: true
  };
}

export function Fragment(props, ...children) {
  return children.flat(Infinity);
}
