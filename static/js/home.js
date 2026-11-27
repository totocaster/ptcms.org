/* Home page: the three law figures, one frame at a time.
   Without this script nothing is lost. Hugo renders every frame, and each law shows its figure
   inside an app above its figure in the Commons, every step stacked and labelled.
   The script adds .hm-live to the laws section, which turns on single-frame mode: one switch flips
   all three figures between the two modes, and each figure's own stepper picks its frame. A stepper
   keeps its position when the mode flips, so the same step is compared in the same frame.
   All copy stays in the page (data/home.yaml); this file only moves between states.
   initial(), reduce() and view() are pure and run in node: require('./static/js/home.js'). */
(function () {
  'use strict';

  var MODES = ['app', 'commons'];

  /* sizes: { law: number of frames }. State: { mode, at: { law: frame index } }. */
  function initial(sizes) {
    var at = {};
    Object.keys(sizes).forEach(function (k) { at[k] = 0; });
    return { mode: MODES[0], at: at };
  }

  /* Actions: { type: 'mode', mode }, { type: 'pick', law, index }, { type: 'back', law }, { type: 'next', law }.
     Back stops at the first frame; Next after the last starts again. Anything invalid changes nothing. */
  function reduce(sizes, state, action) {
    var at = {};
    Object.keys(state.at).forEach(function (k) { at[k] = state.at[k]; });
    var out = { mode: state.mode, at: at };
    var size = sizes[action.law];
    var i = at[action.law];
    if (action.type === 'mode') {
      if (MODES.indexOf(action.mode) >= 0) out.mode = action.mode;
    } else if (size) {
      if (action.type === 'pick' && action.index >= 0 && action.index < size) at[action.law] = action.index;
      else if (action.type === 'back' && i > 0) at[action.law] = i - 1;
      else if (action.type === 'next') at[action.law] = i >= size - 1 ? 0 : i + 1;
    }
    return out;
  }

  /* Everything the page shows for a state. */
  function view(sizes, state) {
    var pressed = {};
    MODES.forEach(function (m) { pressed[m] = m === state.mode; });
    var laws = {};
    Object.keys(sizes).forEach(function (k) {
      var i = state.at[k];
      var items = [];
      for (var j = 0; j < sizes[k]; j++) items.push({ current: j === i, reached: j <= i });
      laws[k] = { index: i, number: i + 1, size: sizes[k], items: items, atStart: i === 0 };
    });
    return { mode: state.mode, pressed: pressed, laws: laws };
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { MODES: MODES, initial: initial, reduce: reduce, view: view };
  }
  if (typeof document === 'undefined') return;

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function words(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }

  function start() {
    var root = document.querySelector('[data-home-laws]');
    if (!root || !root.classList || !root.querySelector('[data-law]')) return;

    var sizes = {};
    var laws = {};
    each(root.querySelectorAll('[data-law]'), function (art) {
      var key = art.getAttribute('data-law');
      var first = art.querySelector('figure[data-for]');
      if (!first) return;
      var keys = [];
      each(first.querySelectorAll('[data-frame]'), function (f) { keys.push(f.getAttribute('data-frame')); });
      if (!keys.length) return;
      var nextLabels = [];
      each(first.querySelectorAll('[data-step]'), function (li) { nextLabels.push(li.getAttribute('data-next-label')); });
      sizes[key] = keys.length;
      laws[key] = {
        key: key,
        keys: keys,
        nextLabels: nextLabels,
        figs: art.querySelectorAll('figure[data-for]'),
        frames: art.querySelectorAll('[data-frame]'),
        picks: art.querySelectorAll('[data-pick]'),
        steps: art.querySelectorAll('[data-step]'),
        backs: art.querySelectorAll('[data-back]'),
        nexts: art.querySelectorAll('[data-next]'),
        nums: art.querySelectorAll('[data-step-num]'),
        live: art.querySelector('[data-live]')
      };
    });
    var modeBtns = root.querySelectorAll('[data-mode-btn]');
    var modeLive = root.querySelector('[data-live="mode"]');
    var state = initial(sizes);

    function shownFrame(L, v) {
      var cur = L.keys[v.laws[L.key].index];
      var out = null;
      each(L.figs, function (fig) {
        if (fig.getAttribute('data-for') === v.mode) out = fig.querySelector('[data-frame="' + cur + '"]');
      });
      return out;
    }

    // A panel that scrolls must be reachable from the keyboard; one that fits needs no tab stop.
    function markScrollable() {
      var v = view(sizes, state);
      Object.keys(laws).forEach(function (k) {
        var shown = shownFrame(laws[k], v);
        each(laws[k].frames, function (f) {
          var box = f.querySelector('.hm-display');
          if (!box) return;
          var scrolls = f === shown && (box.scrollHeight > box.clientHeight + 1 || box.scrollWidth > box.clientWidth + 1);
          if (scrolls) {
            box.setAttribute('tabindex', '0');
            box.setAttribute('role', 'group');
            box.setAttribute('aria-label', words(f.querySelector('[data-frame-label]')));
          } else {
            box.removeAttribute('tabindex');
            box.removeAttribute('role');
            box.removeAttribute('aria-label');
          }
        });
      });
    }

    function render(v) {
      root.setAttribute('data-mode', v.mode);
      each(modeBtns, function (b) { b.setAttribute('aria-pressed', String(!!v.pressed[b.getAttribute('data-mode-btn')])); });
      Object.keys(laws).forEach(function (k) {
        var L = laws[k];
        var lv = v.laws[k];
        var cur = L.keys[lv.index];
        each(L.frames, function (f) { f.hidden = f.getAttribute('data-frame') !== cur; });
        each(L.picks, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-pick') === cur)); });
        each(L.steps, function (li) {
          var it = lv.items[Number(li.getAttribute('data-step'))];
          if (!it) return;
          if (it.current) li.setAttribute('aria-current', 'step');
          else li.removeAttribute('aria-current');
          li.classList.toggle('is-reached', it.reached);
        });
        each(L.backs, function (b) { b.setAttribute('aria-disabled', String(lv.atStart)); });
        each(L.nums, function (n) { n.textContent = String(lv.number); });
        if (L.nextLabels[lv.index]) each(L.nexts, function (b) { b.textContent = L.nextLabels[lv.index]; });
      });
      markScrollable();
    }

    // One polite sentence per change: the mode, or the frame that just came up and what it says.
    function announce(action, v) {
      if (action.type === 'mode') {
        each(modeBtns, function (b) {
          if (b.getAttribute('data-mode-btn') === v.mode && modeLive) modeLive.textContent = b.getAttribute('data-announce') || '';
        });
        return;
      }
      var L = laws[action.law];
      var frame = L && shownFrame(L, v);
      if (!frame || !L.live) return;
      L.live.textContent = words(frame.querySelector('[data-frame-label]')) + '. ' + words(frame.querySelector('[data-say]'));
    }

    function dispatch(action) {
      var before = state;
      state = reduce(sizes, state, action);
      var moved = state.mode !== before.mode || (action.law && state.at[action.law] !== before.at[action.law]);
      if (!moved) return;
      var v = view(sizes, state);
      render(v);
      announce(action, v);
    }

    each(modeBtns, function (b) {
      b.addEventListener('click', function () { dispatch({ type: 'mode', mode: b.getAttribute('data-mode-btn') }); });
    });
    Object.keys(laws).forEach(function (k) {
      var L = laws[k];
      each(L.picks, function (b) {
        b.addEventListener('click', function () { dispatch({ type: 'pick', law: k, index: L.keys.indexOf(b.getAttribute('data-pick')) }); });
      });
      each(L.backs, function (b) { b.addEventListener('click', function () { dispatch({ type: 'back', law: k }); }); });
      each(L.nexts, function (b) { b.addEventListener('click', function () { dispatch({ type: 'next', law: k }); }); });
    });

    each(root.querySelectorAll('[data-js]'), function (el) { el.hidden = false; });
    each(root.querySelectorAll('[data-nojs]'), function (el) { el.hidden = true; });
    root.classList.add('hm-live');
    render(view(sizes, state));

    var timer = null;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(markScrollable, 150);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
