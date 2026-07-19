/* @ds-bundle: {"format":4,"namespace":"GuideRailDesignSystem_a2763f","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Icon","sourcePath":"components/icons/Icon.jsx"},{"name":"Card","sourcePath":"components/layout/Card.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"1d9602939dff","components/core/Button.jsx":"2dc5f871cc21","components/core/IconButton.jsx":"11047cc9e692","components/core/Tag.jsx":"22d7c37884a3","components/feedback/Dialog.jsx":"81b0c22136df","components/feedback/Toast.jsx":"0a9790965526","components/feedback/Tooltip.jsx":"42eaad2bf2cf","components/forms/Checkbox.jsx":"4d1e60a00b61","components/forms/Input.jsx":"3bde09d7f4c3","components/forms/Radio.jsx":"d7af5e2924ea","components/forms/Select.jsx":"f2718ee45016","components/forms/Switch.jsx":"64f21dd30c1d","components/icons/Icon.jsx":"18d05f23b849","components/layout/Card.jsx":"8dfde99552a2","components/navigation/Tabs.jsx":"7483eea6013b","ui_kits/website/About.jsx":"7d319a9b937e","ui_kits/website/FAQ.jsx":"6b0cf6a00cfb","ui_kits/website/Landing.jsx":"afe66cfefbfd","ui_kits/website/Shell.jsx":"391e8ffce2fe"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.GuideRailDesignSystem_a2763f = window.GuideRailDesignSystem_a2763f || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function Badge({
  tone = 'neutral',
  children,
  style,
  ...rest
}) {
  const tones = {
    neutral: {
      background: 'var(--white)',
      color: 'var(--ink-navy)',
      border: '1px solid var(--ruled-blue)'
    },
    success: {
      background: 'var(--earned-green-soft)',
      color: 'var(--earned-green)',
      border: '1px solid var(--earned-green)'
    },
    accent: {
      background: 'var(--paper)',
      color: 'var(--margin-red)',
      border: '1px solid var(--margin-red)'
    }
  };
  return React.createElement('span', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '.04em',
      textTransform: 'uppercase',
      padding: '4px 10px',
      borderRadius: 'var(--radius-pill)',
      ...tones[tone],
      ...style
    },
    ...rest
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
const sizes = {
  sm: {
    padding: '8px 14px',
    fontSize: 'var(--text-sm)'
  },
  md: {
    padding: '11px 20px',
    fontSize: 'var(--text-body)'
  },
  lg: {
    padding: '14px 26px',
    fontSize: 'var(--text-md)'
  }
};
function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  style,
  ...rest
}) {
  const base = {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    borderRadius: 'var(--radius-md)',
    border: '2px solid var(--ink-navy)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'transform var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
    opacity: disabled ? 0.5 : 1,
    ...sizes[size]
  };
  const variants = {
    primary: {
      background: 'var(--margin-red)',
      color: 'var(--paper)',
      borderColor: 'var(--ink-navy)',
      boxShadow: 'var(--shadow-hard-ink)'
    },
    secondary: {
      background: 'var(--paper)',
      color: 'var(--ink-navy)',
      borderColor: 'var(--ink-navy)',
      boxShadow: 'var(--shadow-hard)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--ink-navy)',
      border: '2px solid transparent',
      boxShadow: 'none'
    }
  };
  return React.createElement('button', {
    disabled,
    style: {
      ...base,
      ...variants[variant],
      ...style
    },
    'style-hover': disabled ? {} : {
      transform: 'translate(-2px,-2px)',
      boxShadow: variant === 'ghost' ? 'none' : '10px 10px 0 var(--ruled-blue)'
    },
    'style-active': disabled ? {} : {
      transform: 'translate(2px,2px)',
      boxShadow: variant === 'ghost' ? 'none' : '2px 2px 0 var(--ruled-blue)'
    },
    ...rest
  }, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function IconButton({
  icon,
  label,
  variant = 'secondary',
  disabled = false,
  style,
  ...rest
}) {
  const variants = {
    primary: {
      background: 'var(--margin-red)',
      color: 'var(--paper)',
      border: '2px solid var(--ink-navy)'
    },
    secondary: {
      background: 'var(--paper)',
      color: 'var(--ink-navy)',
      border: '2px solid var(--ink-navy)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--ink-navy)',
      border: '2px solid transparent'
    }
  };
  return React.createElement('button', {
    'aria-label': label,
    disabled,
    title: label,
    style: {
      width: 40,
      height: 40,
      borderRadius: 'var(--radius-sm)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'transform var(--duration-fast) var(--ease-standard)',
      ...variants[variant],
      ...style
    },
    'style-hover': disabled ? {} : {
      transform: 'translate(-1px,-1px)'
    },
    'style-active': disabled ? {} : {
      transform: 'translate(1px,1px)'
    },
    ...rest
  }, icon);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function Tag({
  active = false,
  children,
  onClick,
  style,
  ...rest
}) {
  return React.createElement('button', {
    onClick,
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 14,
      padding: '6px 14px',
      borderRadius: 'var(--radius-pill)',
      border: `1px solid ${active ? 'var(--margin-red)' : 'var(--ruled-blue)'}`,
      background: active ? 'var(--margin-red)' : 'transparent',
      color: active ? 'var(--paper)' : 'var(--ink-navy)',
      cursor: 'pointer',
      transition: 'background var(--duration-fast) var(--ease-standard)',
      ...style
    },
    'style-hover': active ? {} : {
      background: 'var(--ruled-blue)'
    },
    ...rest
  }, children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function Dialog({
  open,
  title,
  children,
  onClose
}) {
  if (!open) return null;
  return React.createElement('div', {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(27,42,74,0.35)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    },
    onClick: onClose
  }, React.createElement('div', {
    style: {
      background: 'var(--paper)',
      border: '2px solid var(--ink-navy)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-hard-ink)',
      padding: 'var(--space-6)',
      maxWidth: 420,
      width: '90%'
    },
    onClick: e => e.stopPropagation()
  }, title && React.createElement('div', {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 22,
      color: 'var(--ink-navy)',
      marginBottom: 12
    }
  }, title), React.createElement('div', {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      color: 'var(--muted-ink)',
      lineHeight: 1.5
    }
  }, children)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function Toast({
  tone = 'success',
  children
}) {
  const tones = {
    success: {
      background: 'var(--earned-green-soft)',
      border: 'var(--earned-green)',
      color: 'var(--earned-green)'
    },
    info: {
      background: 'var(--white)',
      border: 'var(--ink-navy)',
      color: 'var(--ink-navy)'
    }
  };
  const t = tones[tone];
  return React.createElement('div', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      background: t.background,
      border: `2px solid ${t.border}`,
      borderRadius: 'var(--radius-md)',
      padding: '12px 18px',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 14,
      color: t.color,
      boxShadow: 'var(--shadow-hard-sm)'
    }
  }, children);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function Tooltip({
  label,
  children
}) {
  const [show, setShow] = React.useState(false);
  return React.createElement('span', {
    style: {
      position: 'relative',
      display: 'inline-block'
    },
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false)
  }, children, show && React.createElement('span', {
    style: {
      position: 'absolute',
      bottom: '125%',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--ink-navy)',
      color: 'var(--paper)',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      padding: '6px 10px',
      borderRadius: 6,
      whiteSpace: 'nowrap',
      zIndex: 10
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  label,
  checked = false,
  onChange,
  disabled = false,
  style,
  ...rest
}) {
  return React.createElement('label', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      color: 'var(--ink-navy)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      ...style
    }
  }, React.createElement('span', {
    style: {
      width: 20,
      height: 20,
      borderRadius: 6,
      border: '2px solid var(--ink-navy)',
      background: checked ? 'var(--earned-green)' : 'var(--white)',
      borderColor: checked ? 'var(--earned-green)' : 'var(--ink-navy)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, checked && React.createElement('svg', {
    width: 13,
    height: 13,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'var(--paper)',
    strokeWidth: 3,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  }, React.createElement('path', {
    d: 'M20 6 9 17l-5-5'
  }))), React.createElement('input', {
    type: 'checkbox',
    checked,
    onChange,
    disabled,
    style: {
      display: 'none'
    },
    ...rest
  }), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function Input({
  label,
  placeholder,
  error,
  disabled = false,
  type = 'text',
  style,
  ...rest
}) {
  return React.createElement('label', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontFamily: 'var(--font-body)',
      width: '100%'
    }
  }, label && React.createElement('span', {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--ink-navy)'
    }
  }, label), React.createElement('input', {
    type,
    placeholder,
    disabled,
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 16,
      padding: '11px 14px',
      borderRadius: 'var(--radius-sm)',
      border: `2px solid ${error ? 'var(--margin-red)' : 'var(--ruled-blue)'}`,
      background: disabled ? 'var(--ruled-blue)' : 'var(--white)',
      color: 'var(--ink-navy)',
      outline: 'none',
      opacity: disabled ? 0.6 : 1,
      ...style
    },
    'style-focus': {
      borderColor: 'var(--ink-navy)'
    },
    ...rest
  }), error && React.createElement('span', {
    style: {
      fontSize: 12,
      color: 'var(--margin-red)',
      fontFamily: 'var(--font-mono)'
    }
  }, error));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function Radio({
  label,
  checked = false,
  onChange,
  disabled = false,
  style,
  ...rest
}) {
  return React.createElement('label', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      color: 'var(--ink-navy)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      ...style
    }
  }, React.createElement('span', {
    style: {
      width: 20,
      height: 20,
      borderRadius: '50%',
      border: `2px solid ${checked ? 'var(--margin-red)' : 'var(--ink-navy)'}`,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, checked && React.createElement('span', {
    style: {
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: 'var(--margin-red)'
    }
  })), React.createElement('input', {
    type: 'radio',
    checked,
    onChange,
    disabled,
    style: {
      display: 'none'
    },
    ...rest
  }), label);
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function Select({
  label,
  options = [],
  value,
  onChange,
  disabled = false,
  style
}) {
  return React.createElement('label', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontFamily: 'var(--font-body)',
      width: '100%'
    }
  }, label && React.createElement('span', {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--ink-navy)'
    }
  }, label), React.createElement('select', {
    value,
    onChange,
    disabled,
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 16,
      padding: '11px 14px',
      borderRadius: 'var(--radius-sm)',
      border: '2px solid var(--ruled-blue)',
      background: 'var(--white)',
      color: 'var(--ink-navy)',
      opacity: disabled ? 0.6 : 1,
      ...style
    }
  }, options.map(o => React.createElement('option', {
    key: o.value ?? o,
    value: o.value ?? o
  }, o.label ?? o))));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  checked = false,
  onChange,
  disabled = false,
  label,
  style
}) {
  return React.createElement('label', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      color: 'var(--ink-navy)',
      ...style
    }
  }, React.createElement('span', {
    onClick: disabled ? undefined : onChange,
    style: {
      width: 44,
      height: 26,
      borderRadius: 'var(--radius-pill)',
      background: checked ? 'var(--earned-green)' : 'var(--ruled-blue)',
      border: '2px solid var(--ink-navy)',
      position: 'relative',
      transition: 'background var(--duration-normal) var(--ease-standard)',
      flexShrink: 0
    }
  }, React.createElement('span', {
    style: {
      position: 'absolute',
      top: 2,
      left: checked ? 20 : 2,
      width: 18,
      height: 18,
      borderRadius: '50%',
      background: 'var(--white)',
      border: '2px solid var(--ink-navy)',
      transition: 'left var(--duration-normal) var(--ease-standard)'
    }
  })), label);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/icons/Icon.jsx
try { (() => {
const PATHS = {
  check: 'M20 6 9 17l-5-5',
  x: 'M18 6 6 18M6 6l12 12',
  'chevron-down': 'm6 9 6 6 6-6',
  'chevron-right': 'm9 18 6-6-6-6',
  info: 'M12 16v-4M12 8h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z',
  'alert-triangle': 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  'book-open': 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
  clock: 'M12 6v6l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z',
  lock: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4'
};
function Icon({
  name = 'check',
  size = 20,
  color = 'currentColor',
  strokeWidth = 2,
  style,
  ...rest
}) {
  const d = PATHS[name] || PATHS.check;
  return React.createElement('svg', {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style,
    ...rest
  }, React.createElement('path', {
    d
  }));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/Icon.jsx", error: String((e && e.message) || e) }); }

// components/layout/Card.jsx
try { (() => {
function Card({
  children,
  shadow = 'hard',
  style,
  ...rest
}) {
  const shadows = {
    hard: 'var(--shadow-hard)',
    accent: 'var(--shadow-hard-accent)',
    none: 'none'
  };
  return React.createElement('div', {
    style: {
      background: 'var(--white)',
      border: '2px solid var(--ink-navy)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: shadows[shadow],
      padding: 'var(--space-5)',
      ...style
    },
    ...rest
  }, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Card.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  tabs = [],
  value,
  onChange
}) {
  return React.createElement('div', {
    style: {
      display: 'flex',
      borderBottom: '2px solid var(--ruled-blue)',
      gap: 4
    }
  }, tabs.map(t => React.createElement('button', {
    key: t.value,
    onClick: () => onChange && onChange(t.value),
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 15,
      padding: '10px 18px',
      border: 'none',
      borderBottom: `3px solid ${value === t.value ? 'var(--margin-red)' : 'transparent'}`,
      background: 'transparent',
      color: value === t.value ? 'var(--ink-navy)' : 'var(--muted-ink)',
      cursor: 'pointer',
      marginBottom: -2
    }
  }, t.label)));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/About.jsx
try { (() => {
function About({
  ds
}) {
  const paragraphs = ['Every parent knows the moment. You hand your child a laptop for schoolwork, and ten minutes later it\'s YouTube. So you install a blocker — and now it blocks the biology chapter too, because to a crude filter, the human body and the wrong kind of website look the same. The child is angry, the parent is exhausted, and somewhere in the middle, the actual studying stopped being the point.', 'We think the entire industry took a wrong turn at "Access Denied."', 'A blocked page is not a dead end. It is a moment — a child, mid-curiosity, one click from distraction — and that moment is the most teachable second of the whole day. GuideRail was built on a single inversion: what if the wall was a door with a fair price on it? Three questions from what you read this morning. Answer them, and thirty minutes of free time is yours — earned, visible, honest. Not because we gamified discipline, but because we believe children respond to fairness the way all people do: when the deal is transparent, nobody needs to sneak, and nobody needs to shout.', 'We believe the child is not the enemy. Most parental-control software is built like surveillance — it reads messages, tracks locations, reports everything to a cloud, and asks the child to accept being watched. We refuse the premise. GuideRail never reads messages, never tracks location, and the rules that apply to a child are visible to that child, in plain language, always. A tool a child perceives as fair is a tool a child stops fighting.', 'We believe privacy is architecture, not a promise. Your child\'s browsing is checked on the device itself, by a small engine that works even without internet. Nothing to upload means nothing to leak, nothing to subpoena, nothing to trust us about. Where AI helps — writing quiz questions, building worksheets — every name, number, and address is scrubbed out on the device before a single word leaves it, and every AI-written question must prove itself against the page your child actually read, or it is discarded. We built the honesty into the machine so it doesn\'t depend on our good behavior.', 'We believe in guide rails, not gates. The name is the philosophy. A gate stops you. A guide rail runs alongside a mountain road — it lets you travel fast and far, and simply keeps you from going over the edge. In an older telling that shaped this product\'s thinking, the greatest teacher on the battlefield of the Gita was not the warrior but the charioteer — the sarathi — the one who steers so the student can focus on the fight. That is the whole ambition of this tool: to be the quiet charioteer of a child\'s attention. Not the hero. Not the warden. The steady hand on the reins during study hours, and invisible the rest of the time.'];
  const closing = ['And one more belief, stated plainly because this industry rarely does: we will tell you what this product cannot do. A determined teenager can bypass any consumer software; we make bypassing unnecessary instead of impossible, and we document our limits in public. It doesn\'t teach your child mathematics — Khan Academy and NCERT do that beautifully; we make sure your child reaches them, and remembers them. It doesn\'t work on a phone in your child\'s hand — it protects the laptop where homework lives, and gives you the controls on your phone. Every boundary we state is a promise we can keep.', 'We are a small team building this the way we\'d want it for our own children — who are, in fact, our first testers, our sharpest critics, and the names in our credits.'];
  return React.createElement('div', {
    style: {
      padding: '72px 48px 96px',
      display: 'flex',
      justifyContent: 'center'
    }
  }, React.createElement('div', {
    style: {
      maxWidth: 720,
      width: '100%',
      borderLeft: '3px solid var(--margin-red)',
      paddingLeft: 36
    }
  }, React.createElement('div', {
    style: {
      fontFamily: 'var(--font-mono)',
      textTransform: 'uppercase',
      letterSpacing: '.08em',
      fontSize: 12,
      color: 'var(--margin-red)'
    }
  }, 'Our philosophy'), React.createElement('h1', {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 38,
      color: 'var(--ink-navy)',
      margin: '10px 0 40px',
      lineHeight: 1.2
    }
  }, 'Why we built a filter that teaches'), React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 28
    }
  }, paragraphs.map((p, i) => React.createElement('p', {
    key: i,
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 18,
      color: i % 2 === 1 && p.length < 80 ? 'var(--ink-navy)' : 'var(--muted-ink)',
      fontWeight: p.length < 80 ? 700 : 400,
      lineHeight: 1.7,
      margin: 0
    }
  }, p))), React.createElement('div', {
    style: {
      margin: '40px 0',
      borderLeft: '3px solid var(--margin-red)',
      paddingLeft: 20,
      marginLeft: -36,
      paddingTop: 2,
      paddingBottom: 2
    }
  }, React.createElement('div', {
    style: {
      fontFamily: 'var(--font-body)',
      fontStyle: 'italic',
      fontSize: 19,
      color: 'var(--ink-navy)'
    }
  }, '"Rok-tok nahi — saarthi."')), React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 28,
      marginTop: 4
    }
  }, closing.map((p, i) => React.createElement('p', {
    key: i,
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 18,
      color: 'var(--muted-ink)',
      lineHeight: 1.7,
      margin: 0
    }
  }, p))), React.createElement('div', {
    style: {
      marginTop: 48,
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 16,
      color: 'var(--ink-navy)'
    }
  }, '— The GuideRail team, Bengaluru & the family study table')));
}
window.About = {
  About
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/About.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/FAQ.jsx
try { (() => {
const CATS = [{
  id: 'A',
  title: 'Who is it for',
  items: [{
    q: 'Which classes and ages does it support?',
    a: "Class 3 through Class 12 — roughly ages 8 to 17, any child who reads independently, because our quizzes come from the child's own reading. For pre-readers (LKG/UKG/Class 1–2) a simple \"Little Mode\" — filtering and image safety without quizzes — is on our roadmap. College and exam-prep self-control is a different product for a different day; we'd rather do one thing honestly.",
    hi: '"Class 3 se 12 tak — jo bachcha khud padh sakta hai, uske liye."'
  }, {
    q: 'Which devices does it work on?',
    a: "The child's protection runs in Chrome on laptops, desktops, and Chromebooks — Chromebooks especially; we engineered for the most affordable ones. Your parent dashboard, approvals, and Sunday report work on any phone. Chrome on Android/iOS cannot run extensions at all (a platform rule for every extension product, not just ours) — so the deal is: child studies on the laptop, you stay in control from your phone. Edge support is coming.",
    hi: '"Bachche ki padhai laptop pe, aapka control aapke phone pe."'
  }, {
    q: 'Do we have to upload the course or syllabus?',
    a: "No uploads, no setup projects. You pick your child's class and board — CBSE, ICSE, general homeschool — from a list, and the ready-made curriculum pack activates instantly. We curate packs from the actual board syllabi and keep adding classes; if your class isn't live yet, we'll tell you honestly rather than pretend.",
    hi: '"Kuch upload nahi karna. Bas class aur board choose karo — syllabus humne pehle se bhara hai."'
  }, {
    q: "I'm a teacher — do I need to create and upload study plans?",
    a: 'No. GuideRail generates quizzes from what the student actually reads — automatically. Your only optional involvement is curating this week\'s allowed resources in the school version, a one-click bookmark-style action. If an edtech tool gives you homework, it has failed; we designed against that.'
  }, {
    q: 'Does it actually help with teaching, or only blocking?',
    a: "Both, genuinely. One click on any webpage produces a printable worksheet with an answer key — half of lesson-prep, done. And every distraction attempt becomes retrieval practice on that day's reading — one of the strongest evidence-backed learning techniques, running automatically, all term. The weekly report shows which topics landed and where quiz scores dipped. What it deliberately does NOT do: replace the teacher or the textbook. It works alongside the best teaching content; it doesn't compete with it.",
    hi: '"Padhata Khan Academy hai; yaad GuideRail karwata hai."'
  }]
}, {
  id: 'B',
  title: 'How it works',
  items: [{
    q: 'Is this spyware?',
    a: "No — and we've designed it so it can't quietly become spyware. No message reading, no location tracking, no social-media monitoring. It works during the study hours you set, checks pages on the device itself, and your child can see every rule that applies to them. Transparency isn't a feature; it's the deal that makes the whole product work."
  }, {
    q: 'How much AI does it use, and where?',
    a: "The filtering uses no AI at all — it's a fast, deterministic engine inside the device, which is why it works offline and why browsing never leaves the computer. AI appears in exactly two places: writing quiz questions and building worksheets, both through one controlled channel. Two guarantees: personal details are scrubbed on the device before any text reaches the AI — it never learns who your child is; and every AI question must carry a verified snippet from the page your child actually read, or it's automatically discarded and a hand-written question takes its place.",
    hi: '"AI ko bachche ka naam tak nahi pata."'
  }, {
    q: 'Can my kid just bypass it?',
    a: "A determined teenager can bypass any consumer software — anyone who says otherwise is overclaiming. Our answer is layered: tamper-resistance during study hours, a hardened managed setup for schools, and most importantly a design kids don't want to bypass, because earning time honestly beats sneaking. We document our limits publicly; every boundary we state is a promise we can keep."
  }, {
    q: 'Do schools need to provide their own AI API key?',
    a: 'No. The subscription includes everything — no API keys, no cloud accounts, no technical setup. All AI flows through our managed, safety-checked channel; that channel is precisely where the privacy scrubbing and question-verification live, so keeping it managed is what keeps it safe.',
    hi: '"Koi API key, koi technical setup nahi — aap class chuniye, hum sab sambhalte hain."'
  }, {
    q: 'How big and heavy is the app?',
    a: 'Smaller than a single WhatsApp photo — under 5 MB total. The engine is built in Rust and engineered to add less than one frame (16 milliseconds) of work even on a ₹15,000 Chromebook, so browsing never stutters. And the core protection works fully offline.',
    hi: '"Poora app ek WhatsApp photo se chhota, aur sasti Chromebook pe bhi ekdum smooth."'
  }]
}];
function FAQ({
  ds
}) {
  const {
    Tag
  } = ds;
  const [filter, setFilter] = React.useState('all');
  const [openKey, setOpenKey] = React.useState(null);
  const cats = CATS.filter(c => filter === 'all' || c.id === filter);
  return React.createElement('div', {
    style: {
      maxWidth: 760,
      margin: '0 auto',
      padding: '72px 48px 96px'
    }
  }, React.createElement('div', {
    style: {
      fontFamily: 'var(--font-mono)',
      textTransform: 'uppercase',
      letterSpacing: '.08em',
      fontSize: 12,
      color: 'var(--margin-red)'
    }
  }, 'FAQ'), React.createElement('h1', {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 42,
      color: 'var(--ink-navy)',
      margin: '10px 0 28px'
    }
  }, 'Questions parents ask'), React.createElement('div', {
    style: {
      display: 'flex',
      gap: 8,
      marginBottom: 40
    }
  }, React.createElement(Tag, {
    active: filter === 'all',
    onClick: () => setFilter('all')
  }, 'All'), CATS.map(c => React.createElement(Tag, {
    key: c.id,
    active: filter === c.id,
    onClick: () => setFilter(c.id)
  }, c.title))), cats.map(cat => React.createElement('div', {
    key: cat.id,
    style: {
      marginBottom: 40
    }
  }, React.createElement('div', {
    style: {
      borderLeft: '3px solid var(--margin-red)',
      paddingLeft: 16,
      marginBottom: 16
    }
  }, React.createElement('div', {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '.08em',
      color: 'var(--margin-red)'
    }
  }, `Category ${cat.id}`), React.createElement('div', {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 22,
      color: 'var(--ink-navy)'
    }
  }, cat.title)), React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, cat.items.map((item, i) => {
    const key = `${cat.id}${i}`;
    const isOpen = openKey === key;
    return React.createElement('div', {
      key,
      style: {
        borderBottom: '1px solid var(--ruled-blue)'
      }
    }, React.createElement('div', {
      onClick: () => setOpenKey(isOpen ? null : key),
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '18px 4px',
        cursor: 'pointer',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 16,
        color: 'var(--ink-navy)',
        gap: 16
      }
    }, item.q, React.createElement('span', {
      style: {
        color: 'var(--margin-red)',
        fontSize: 20,
        flexShrink: 0,
        transform: isOpen ? 'rotate(45deg)' : 'none',
        transition: 'transform var(--duration-fast) var(--ease-standard)'
      }
    }, '+')), isOpen && React.createElement('div', {
      style: {
        padding: '0 4px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }
    }, React.createElement('div', {
      style: {
        fontFamily: 'var(--font-body)',
        fontSize: 15,
        color: 'var(--muted-ink)',
        lineHeight: 1.6
      }
    }, item.a), item.hi && React.createElement('div', {
      style: {
        borderLeft: '3px solid var(--margin-red)',
        paddingLeft: 16,
        fontFamily: 'var(--font-body)',
        fontStyle: 'italic',
        fontSize: 15,
        color: 'var(--ink-navy)'
      }
    }, item.hi)));
  })))));
}
window.FAQ = {
  FAQ
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/FAQ.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Landing.jsx
try { (() => {
function Landing({
  ds
}) {
  const {
    Button,
    Card,
    Badge,
    Icon,
    Input
  } = ds;
  const QUIZ = [{
    q: 'Water vapor rises and cools to form clouds. This process is called:',
    options: ['Condensation', 'Evaporation', 'Precipitation'],
    correct: 0
  }, {
    q: 'Water falls from clouds as rain, snow, or hail. This is:',
    options: ['Collection', 'Precipitation', 'Runoff'],
    correct: 1
  }, {
    q: 'Rivers carry water back to the ocean in the stage called:',
    options: ['Collection', 'Condensation', 'Transpiration'],
    correct: 0
  }];
  const [step, setStep] = React.useState('blocked');
  const [qi, setQi] = React.useState(0);
  const [picked, setPicked] = React.useState(null);
  const [correctCount, setCorrectCount] = React.useState(0);
  const [timer, setTimer] = React.useState(30 * 60);
  React.useEffect(() => {
    if (step !== 'earned') return;
    const id = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [step]);
  const mm = String(Math.floor(timer / 60)).padStart(2, '0');
  const ss = String(timer % 60).padStart(2, '0');
  function choose(i) {
    if (picked !== null) return;
    setPicked(i);
    const isRight = i === QUIZ[qi].correct;
    if (isRight) setCorrectCount(c => c + 1);
    setTimeout(() => {
      if (qi < QUIZ.length - 1) {
        setQi(qi + 1);
        setPicked(null);
      } else setStep('earned');
    }, 700);
  }
  function restart() {
    setStep('blocked');
    setQi(0);
    setPicked(null);
    setCorrectCount(0);
    setTimer(30 * 60);
  }
  const steps = [{
    icon: 'shield',
    title: 'One profile per child',
    body: 'Pick class & board — CBSE, ICSE, homeschool. No uploads, ever.'
  }, {
    icon: 'book-open',
    title: 'Distraction becomes a quiz',
    body: "3 questions from today's actual reading. Pass, and earn 30 visible minutes."
  }, {
    icon: 'clock',
    title: 'One Sunday report',
    body: 'All kids, what they read, quizzes passed, time earned — plus a one-click worksheet maker.'
  }];
  const audiences = [{
    who: 'Parents',
    body: 'Four kids, four classes, one dashboard. Screen time stops being a daily fight.'
  }, {
    who: 'Teacher-parents',
    body: 'The blocked moment becomes retrieval practice. Any webpage becomes a printable worksheet.'
  }, {
    who: 'Kids',
    body: 'No spying, no sneaking. Visible rules, honest deal: show you learned it, unlock your time.'
  }];
  const checklist = ['Filtering runs locally', 'No child accounts anywhere', 'Personal details scrubbed on-device before anything leaves', 'No messages, no location, no social monitoring — ever', 'Works during study hours only; the child can see every rule'];
  const plans = [{
    name: 'Free',
    price: '₹0 / $0',
    features: ['Filtering', 'Quiz gate — 5 AI quizzes/mo', '1 profile']
  }, {
    name: 'Family',
    price: '$7/mo-equivalent · founder price for beta',
    features: ['Unlimited quizzes & worksheets', '5 profiles', 'Weekly digest', 'Ask-to-unlock']
  }, {
    name: 'Co-op / School',
    price: '$4/family/mo · 10-family minimum',
    features: ['Shared allowlists', 'Admin dashboard']
  }];
  const miniFaq = [{
    q: 'Is this spyware?',
    a: 'No — filtering runs on-device, and there is nothing to send: no messages, no location, no social monitoring.'
  }, {
    q: 'Which devices?',
    a: 'iOS and Android phones and tablets today.'
  }, {
    q: 'Which classes?',
    a: 'Any CBSE, ICSE, or homeschool syllabus a parent sets up per child profile.'
  }];
  return React.createElement('div', null, React.createElement('div', {
    style: {
      backgroundImage: 'var(--ruled-line-bg)',
      position: 'relative',
      padding: '72px 48px 96px'
    }
  }, React.createElement('div', {
    style: {
      position: 'absolute',
      left: 48,
      top: 0,
      bottom: 0,
      width: 3,
      background: 'var(--margin-red)'
    }
  }), React.createElement('div', {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 48,
      maxWidth: 1200,
      margin: '0 auto',
      paddingLeft: 32,
      alignItems: 'start'
    }
  }, React.createElement('div', null, React.createElement('h1', {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 52,
      lineHeight: 1.1,
      color: 'var(--ink-navy)',
      margin: 0
    }
  }, 'Earn it, ', React.createElement('span', {
    style: {
      color: 'var(--earned-green)'
    }
  }, 'fair and square'), '.'), React.createElement('p', {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 17,
      color: 'var(--muted-ink)',
      lineHeight: 1.6,
      marginTop: 20,
      maxWidth: 520
    }
  }, "The study browser that turns blocked pages into learning — and screen time into a reward. It knows your child's syllabus, allows the schoolwork, and quizzes the distractions. No spying, no shouting."), React.createElement('div', {
    style: {
      display: 'flex',
      gap: 14,
      marginTop: 32
    }
  }, React.createElement(Button, {
    variant: 'primary',
    size: 'lg'
  }, 'Join the free beta'), React.createElement(Button, {
    variant: 'secondary',
    size: 'lg'
  }, 'How it works'))), React.createElement(Card, {
    shadow: 'hard',
    style: {
      padding: 0,
      overflow: 'hidden'
    }
  }, React.createElement('div', {
    style: {
      padding: '14px 20px',
      borderBottom: '2px solid var(--ruled-blue)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--muted-ink)'
    }
  }, React.createElement(Icon, {
    name: 'lock',
    size: 14
  }), 'youtube.com — blocked during study hours'), step === 'blocked' && React.createElement('div', {
    style: {
      padding: 28,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
      textAlign: 'center'
    }
  }, React.createElement(Icon, {
    name: 'shield',
    size: 36,
    color: 'var(--margin-red)'
  }), React.createElement('div', {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 18,
      color: 'var(--ink-navy)'
    }
  }, 'This page is blocked right now.'), React.createElement('div', {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      color: 'var(--muted-ink)'
    }
  }, "Pass a 3-question quiz on today's reading to earn 30 minutes."), React.createElement(Button, {
    variant: 'primary',
    onClick: () => setStep('quiz')
  }, 'Start quiz')), step === 'quiz' && React.createElement('div', {
    style: {
      padding: 28
    }
  }, React.createElement('div', {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '.08em',
      color: 'var(--margin-red)',
      marginBottom: 10
    }
  }, `The Water Cycle — Question ${qi + 1} of ${QUIZ.length}`), React.createElement('div', {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 18,
      color: 'var(--ink-navy)',
      marginBottom: 16
    }
  }, QUIZ[qi].q), React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, QUIZ[qi].options.map((opt, i) => {
    const isPicked = picked === i;
    const isCorrect = i === QUIZ[qi].correct;
    let bg = 'var(--white)',
      border = 'var(--ruled-blue)',
      color = 'var(--ink-navy)';
    if (picked !== null && isPicked) {
      bg = isCorrect ? 'var(--earned-green-soft)' : '#FBEAE8';
      border = isCorrect ? 'var(--earned-green)' : 'var(--margin-red)';
      color = isCorrect ? 'var(--earned-green)' : 'var(--margin-red)';
    }
    return React.createElement('button', {
      key: i,
      onClick: () => choose(i),
      style: {
        textAlign: 'left',
        padding: '12px 16px',
        borderRadius: 'var(--radius-sm)',
        border: `2px solid ${border}`,
        background: bg,
        color,
        fontFamily: 'var(--font-body)',
        fontSize: 15,
        cursor: picked === null ? 'pointer' : 'default'
      }
    }, opt);
  }))), step === 'earned' && React.createElement('div', {
    style: {
      padding: 28,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
      textAlign: 'center'
    }
  }, React.createElement(Icon, {
    name: 'check',
    size: 32,
    color: 'var(--earned-green)'
  }), React.createElement(Badge, {
    tone: 'success'
  }, `${correctCount} of ${QUIZ.length} correct — earned`), React.createElement('div', {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 48,
      fontWeight: 600,
      color: 'var(--earned-green)'
    }
  }, `${mm}:${ss}`), React.createElement('div', {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      color: 'var(--muted-ink)'
    }
  }, 'earned screen time, visible and unlocked'), React.createElement(Button, {
    variant: 'ghost',
    onClick: restart
  }, 'Replay demo'))))), React.createElement('div', {
    style: {
      padding: '72px 48px',
      maxWidth: 1200,
      margin: '0 auto'
    }
  }, React.createElement('div', {
    style: {
      borderLeft: '3px solid var(--margin-red)',
      paddingLeft: 20,
      marginBottom: 40
    }
  }, React.createElement('div', {
    style: {
      fontFamily: 'var(--font-mono)',
      textTransform: 'uppercase',
      letterSpacing: '.08em',
      fontSize: 12,
      color: 'var(--margin-red)'
    }
  }, 'How it works'), React.createElement('div', {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 30,
      color: 'var(--ink-navy)',
      marginTop: 6
    }
  }, 'Three steps, every school night')), React.createElement('div', {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 24
    }
  }, steps.map((s, i) => React.createElement(Card, {
    key: s.title,
    shadow: 'hard',
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, React.createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, React.createElement(Icon, {
    name: s.icon,
    size: 24,
    color: 'var(--margin-red)'
  }), React.createElement('span', {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--muted-ink)'
    }
  }, `0${i + 1}`)), React.createElement('div', {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 18,
      color: 'var(--ink-navy)'
    }
  }, s.title), React.createElement('div', {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      color: 'var(--muted-ink)',
      lineHeight: 1.5
    }
  }, s.body))))), React.createElement('div', {
    style: {
      background: 'var(--white)',
      borderTop: '2px solid var(--ruled-blue)',
      borderBottom: '2px solid var(--ruled-blue)',
      padding: '64px 48px'
    }
  }, React.createElement('div', {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 32,
      maxWidth: 1200,
      margin: '0 auto'
    }
  }, audiences.map(a => React.createElement('div', {
    key: a.who
  }, React.createElement(Badge, {
    tone: 'neutral',
    style: {
      marginBottom: 12
    }
  }, a.who), React.createElement('div', {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 16,
      color: 'var(--ink-navy)',
      lineHeight: 1.55
    }
  }, a.body))))), React.createElement('div', {
    style: {
      padding: '64px 48px',
      display: 'flex',
      justifyContent: 'center'
    }
  }, React.createElement('div', {
    style: {
      borderLeft: '3px solid var(--margin-red)',
      paddingLeft: 20,
      fontFamily: 'var(--font-body)',
      fontStyle: 'italic',
      fontSize: 20,
      color: 'var(--ink-navy)',
      maxWidth: 560
    }
  }, '"Bachcha khud bolega — Papa, maine 30 minute kamaye hain."')), React.createElement('div', {
    style: {
      padding: '72px 48px',
      maxWidth: 900,
      margin: '0 auto'
    }
  }, React.createElement('h2', {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 30,
      color: 'var(--ink-navy)',
      margin: '0 0 12px'
    }
  }, 'Private by architecture, not by promise.'), React.createElement('p', {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 16,
      color: 'var(--muted-ink)',
      lineHeight: 1.6,
      marginBottom: 24,
      maxWidth: 640
    }
  }, "Most safety tools send your child's browsing to the cloud and ask you to trust them. GuideRail checks pages on the device itself — so there's nothing to trust, because there's nothing to send."), React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, checklist.map(c => React.createElement('div', {
    key: c,
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start'
    }
  }, React.createElement(Icon, {
    name: 'check',
    size: 18,
    color: 'var(--earned-green)',
    style: {
      flexShrink: 0,
      marginTop: 2
    }
  }), React.createElement('span', {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      color: 'var(--ink-navy)'
    }
  }, c))))), React.createElement('div', {
    style: {
      padding: '72px 48px',
      background: 'var(--white)',
      borderTop: '2px solid var(--ruled-blue)',
      borderBottom: '2px solid var(--ruled-blue)'
    }
  }, React.createElement('div', {
    style: {
      maxWidth: 1200,
      margin: '0 auto'
    }
  }, React.createElement('div', {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 30,
      color: 'var(--ink-navy)',
      marginBottom: 32,
      textAlign: 'center'
    }
  }, 'Pricing'), React.createElement('div', {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 24
    }
  }, plans.map(p => React.createElement(Card, {
    key: p.name,
    shadow: p.name === 'Family' ? 'accent' : 'hard',
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, React.createElement('div', {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 20,
      color: 'var(--ink-navy)'
    }
  }, p.name), React.createElement('div', {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 15,
      color: 'var(--margin-red)'
    }
  }, p.price), React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, p.features.map(f => React.createElement('div', {
    key: f,
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      color: 'var(--muted-ink)'
    }
  }, `· ${f}`)))))))), React.createElement('div', {
    style: {
      padding: '80px 48px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20,
      textAlign: 'center'
    }
  }, React.createElement('div', {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 30,
      color: 'var(--ink-navy)'
    }
  }, 'Be a founding family.'), React.createElement('div', {
    style: {
      display: 'flex',
      gap: 12,
      maxWidth: 420,
      width: '100%'
    }
  }, React.createElement(Input, {
    placeholder: 'you@example.com',
    style: {
      flex: 1
    }
  }), React.createElement(Button, {
    variant: 'primary'
  }, 'Join beta')), React.createElement('div', {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--muted-ink)'
    }
  }, 'No spam, ever. One email when the beta opens, one when pricing launches.')), React.createElement('div', {
    style: {
      padding: '64px 48px 88px',
      maxWidth: 900,
      margin: '0 auto'
    }
  }, React.createElement('div', {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 22,
      color: 'var(--ink-navy)',
      marginBottom: 24
    }
  }, 'A few quick questions'), React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      marginBottom: 24
    }
  }, miniFaq.map(f => React.createElement('div', {
    key: f.q
  }, React.createElement('div', {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 16,
      color: 'var(--ink-navy)',
      marginBottom: 4
    }
  }, f.q), React.createElement('div', {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      color: 'var(--muted-ink)',
      lineHeight: 1.5
    }
  }, f.a)))), React.createElement('a', {
    href: '#',
    onClick: e => {
      e.preventDefault();
    },
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 14,
      color: 'var(--margin-red)'
    }
  }, 'See the full FAQ →')));
}
window.Landing = {
  Landing
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Landing.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Shell.jsx
try { (() => {
function NavBar({
  page,
  onNavigate
}) {
  const links = [{
    id: 'landing',
    label: 'Home'
  }, {
    id: 'about',
    label: 'Philosophy'
  }, {
    id: 'faq',
    label: 'FAQ'
  }];
  return React.createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 48px',
      borderBottom: '2px solid var(--ruled-blue)',
      position: 'sticky',
      top: 0,
      background: 'var(--paper)',
      zIndex: 20
    }
  }, React.createElement('div', {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 24,
      cursor: 'pointer'
    },
    onClick: () => onNavigate('landing')
  }, React.createElement('span', {
    style: {
      color: 'var(--ink-navy)'
    }
  }, 'Guide'), React.createElement('span', {
    style: {
      color: 'var(--margin-red)'
    }
  }, 'Rail')), React.createElement('div', {
    style: {
      display: 'flex',
      gap: 32
    }
  }, links.map(l => React.createElement('span', {
    key: l.id,
    onClick: () => onNavigate(l.id),
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 15,
      cursor: 'pointer',
      color: page === l.id ? 'var(--margin-red)' : 'var(--ink-navy)',
      borderBottom: page === l.id ? '2px solid var(--margin-red)' : '2px solid transparent',
      paddingBottom: 4
    }
  }, l.label))));
}
function Footer() {
  return React.createElement('div', {
    style: {
      borderTop: '2px solid var(--ruled-blue)',
      padding: '40px 48px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontFamily: 'var(--font-body)',
      color: 'var(--muted-ink)',
      fontSize: 14
    }
  }, React.createElement('div', {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 18
    }
  }, React.createElement('span', {
    style: {
      color: 'var(--ink-navy)'
    }
  }, 'Guide'), React.createElement('span', {
    style: {
      color: 'var(--margin-red)'
    }
  }, 'Rail')), React.createElement('div', {
    style: {
      fontStyle: 'italic'
    }
  }, "Filtering tools don't teach. Teaching tools don't protect. GuideRail does both."));
}
window.Shell = {
  NavBar,
  Footer
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Shell.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
