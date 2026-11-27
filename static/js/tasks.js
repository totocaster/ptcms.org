/* Plaintext Tasks guide and atlas.
   Guide: pressing a note highlights the lines it governs and shows only that note.
   Atlas: the checker re-reads the textarea, lists problems, outlines matching atlas cells
   and draws a preview.
   analyze() is pure. In node, `node static/js/tasks.js < file.tasks.md` prints its result
   as the `example:` block of data/tasks/atlas.yaml. */
(function () {
  'use strict';

  var STATES = { ' ': 'open', x: 'done', '>': 'deferred', '-': 'canceled' };
  var DATE_KEYS = ['created', 'date', 'due', 'done', 'defer-until', 'canceled'];
  var RANK = { valid: 0, tolerated: 1, open: 2, invalid: 3 };

  function analyze(input) {
    var raw = String(input == null ? '' : input).split('\n');
    if (raw.length > 1 && raw[raw.length - 1] === '') raw.pop();
    var lines = [];
    var problems = [];
    var hits = {};
    var stack = []; // open blocks, shallowest first: { depth, idx, kind: 'heading' | 'task' }
    var seenTitle = false, seenContent = false, seenSep = false, crlfSeen = false;
    var headingInRegion = false, rootTaskInRegion = false;

    function owner(depth) {
      for (var k = stack.length - 1; k >= 0; k--) if (stack[k].depth < depth) return stack[k];
      return null;
    }

    raw.forEach(function (src, i) {
      var crlf = src.charAt(src.length - 1) === '\r';
      var text = crlf ? src.slice(0, -1) : src;
      var ws = /^[ \t]*/.exec(text)[0];
      var body = text.slice(ws.length);
      var width = ws.replace(/\t/g, '  ').length;
      var depth = Math.floor(width / 2);
      var rec = { line: i + 1, text: text, type: 'note', verdict: 'valid', depth: depth, ok: true };
      lines.push(rec);

      function flag(verdict, title, hint, rules, sections, cell) {
        problems.push({ line: rec.line, verdict: verdict, title: title, hint: hint, rules: rules, sections: sections, cell: cell });
        if (RANK[verdict] > RANK[rec.verdict]) rec.verdict = verdict;
        if (cell) {
          hits[cell] = hits[cell] || [];
          if (hits[cell].indexOf(rec.line) < 0) hits[cell].push(rec.line);
        }
      }
      function invalid(title, hint, rules, sections, cell) {
        rec.ok = false;
        flag('invalid', title, hint, rules, sections, cell);
      }

      if (body.trim() === '') { rec.type = 'blank'; return; }
      if (ws.indexOf('\t') >= 0) flag('tolerated', 'Tab indentation', 'Readers may accept tabs on import. Writers use two spaces per level and must not write tabs.', ['T-20', 'T-21', 'T-22'], [], 'indent-width-t');
      else if (width % 2) flag('tolerated', 'Odd indentation', 'Readers may accept other widths on import. Writers normalize to two spaces per level.', ['T-21', 'T-22'], [], 'indent-width-t');
      if (crlf && !crlfSeen) { crlfSeen = true; flag('tolerated', 'CRLF line endings', 'CRLF is accepted; LF is preferred.', [], ['4'], 'file-endings-t'); }

      // Archive separator, or something shaped like one.
      if (/^-{3,}\s*$/.test(body)) {
        rec.type = 'sep';
        if (width === 0 && body === '---' && !seenSep) {
          seenSep = true; stack = []; headingInRegion = false; rootTaskInRegion = false;
        } else if (width > 0) invalid('Indented separator', 'The archive separator sits at root indentation.', ['T-16'], [], 'sep-placement-i');
        else if (body !== '---') invalid('Not exactly `---`', 'The archive separator is exactly three hyphens, with nothing after them.', ['T-17'], [], 'sep-shape-i');
        else invalid('Second separator', 'The archive separator appears at most once in a document.', ['T-18'], [], 'sep-shape-i');
        return;
      }

      // Document title or section heading.
      if (body.charAt(0) === '#') {
        var hm = /^(#+)([ \t]*)(.*)$/.exec(body);
        var isTitle = hm[1].length === 1;
        var what = isTitle ? 'title' : 'heading';
        var sec = isTitle ? ['7.2'] : ['7.3'];
        var cellI = isTitle ? 'title-place-i' : 'heading-shape-i';
        rec.type = what;
        if (width > 0) { invalid('Indented ' + what, 'A ' + (isTitle ? 'document title' : 'section heading') + ' starts at the beginning of the line.', ['T-13'], sec, cellI); return; }
        if (hm[1].length > 6) { invalid('Too many `#`', 'Section headings use two to six `#`.', ['T-13'], ['7.3'], 'heading-shape-i'); return; }
        if (hm[2] === '') { invalid('No space after `#`', 'Write one space between the `#` and the text.', ['T-13'], sec, cellI); return; }
        if (hm[3].trim() === '') { invalid('Empty ' + what, 'Write the text after the `#` and the space.', [], sec, cellI); return; }
        if (hm[2] !== ' ') flag('tolerated', 'Spacing after `#`', 'Writers put exactly one space after the `#`.', ['T-45'], sec, '');
        rec.title = hm[3];
        if (isTitle) {
          if (seenTitle) flag('tolerated', 'Second document title', 'A document title should appear at most once. Use `##` for a section.', ['T-2'], [], 'title-place-t');
          else if (seenContent || seenSep) flag('tolerated', 'Title after content', 'A document title should come before any sections, tasks or notes.', ['T-3'], [], 'title-place-t');
          seenTitle = true;
        } else {
          seenContent = true; headingInRegion = true;
          stack = [{ depth: 0, idx: i, kind: 'heading' }];
        }
        return;
      }

      // Task line, or something shaped like one.
      if (/^[-*+]\s*\[/.test(body)) {
        rec.type = 'task'; rec.meta = []; seenContent = true;
        if (width === 0) rootTaskInRegion = true;
        var bm = /^- \[([^\]]*)\]/.exec(body);
        if (/^[*+]/.test(body)) invalid('Wrong task bullet', 'Only `-` is a valid task bullet in 0.1.1.', ['T-5'], [], 'task-bullet-i');
        else if (!bm) invalid('Checkbox spacing', 'Write `- [ ]` with exactly one space after the dash.', ['T-6'], [], 'task-spacing-i');
        else if (bm[1] === 'X') invalid('Uppercase `[X]`', 'The done state is `[x]`, lowercase.', [], ['7.4'], 'task-state-i');
        else if (bm[1].length === 1 && !STATES.hasOwnProperty(bm[1])) invalid('Unknown state', 'The four states are `[ ]`, `[x]`, `[>]` and `[-]`.', [], ['7.4'], 'task-state-i');
        else if (bm[1].length !== 1) invalid('Checkbox spacing', 'The checkbox holds exactly one character: `[ ]`, `[x]`, `[>]` or `[-]`.', ['T-6'], ['7.4'], 'task-spacing-i');
        else {
          var rest = body.slice(bm[0].length);
          if (rest.trim() === '') invalid('Task with no title', 'A task line is `- [ ]`, one space, then the title.', [], ['7.4'], 'task-spacing-i');
          else if (!/^ \S/.test(rest)) invalid('Checkbox spacing', 'Write exactly one space between the checkbox and the title.', ['T-6'], [], 'task-spacing-i');
          else { rec.state = bm[1]; rec.title = rest.slice(1); }
        }
        stack = stack.filter(function (b) { return b.depth < depth; });
        if (depth > 0) {
          var top = stack[stack.length - 1];
          if (top && top.kind === 'task' && top.depth === depth - 1) rec.parent = top.idx;
          else if (rec.ok) invalid('Subtask with nothing to attach to', 'Indented like a subtask, but no task sits one level up.', ['T-42'], [], 'task-nesting-i');
        }
        stack.push({ depth: depth, idx: i, kind: 'task' });
        return;
      }

      // Metadata line, or something shaped like one.
      if (body.charAt(0) === '@') {
        rec.type = 'meta';
        var mm = /^@([^\s:]+):(.*)$/.exec(body);
        if (!mm) { invalid('Malformed metadata', 'A metadata line is `@key: value`, with a colon after the key.', ['T-13'], ['7.5'], 'meta-value-i'); return; }
        if (width === 0) { invalid('Metadata not indented', 'Metadata lines are indented deeper than their task.', ['T-10'], [], 'meta-placement-i'); return; }
        var own = owner(depth);
        if (!own || own.kind !== 'task' || own.depth !== depth - 1) { invalid('Metadata with no task', 'A metadata line attaches to the non-nested task one level up.', ['T-40'], [], 'meta-placement-i'); return; }
        if (lines[own.idx].depth > 0) { invalid('Metadata on a nested task', 'Only non-nested tasks carry metadata. Nested tasks inherit it.', ['T-11', 'T-27'], [], 'meta-nested-i'); return; }
        var sp = /^\s*/.exec(mm[2])[0];
        var value = mm[2].slice(sp.length);
        var key = mm[1].toLowerCase();
        if (value !== '' && sp !== ' ') flag('tolerated', sp === '' ? 'No space after the colon' : 'Extra space after the colon', 'Writers put exactly one space after a metadata colon.', ['T-45'], [], '');
        if (DATE_KEYS.indexOf(key) >= 0 && !/^\d{4}-\d{2}-\d{2}$/.test(value)) flag('tolerated', 'Date not in `YYYY-MM-DD`', 'The recommended form for `@' + mm[1] + '` is `YYYY-MM-DD`.', ['T-9'], ['7.5'], 'meta-value-t');
        if (key === 'priority' && !/^[123]$/.test(value)) flag('tolerated', 'Priority outside 1, 2 or 3', 'The recommended `@priority` values are `1`, `2` and `3`.', ['T-9'], ['7.5'], 'meta-value-t');
        lines[own.idx].meta.push('@' + mm[1] + ' ' + value);
        return;
      }

      // Anything else is a note.
      rec.type = 'note'; seenContent = true;
      if (width === 0) {
        if (headingInRegion) flag('open', 'Root-level note under a heading', 'The spec’s quick example has one, but notes are meant to be indented deeper than their parent.', ['T-14'], ['6'], 'open-root-note');
        else if (rootTaskInRegion) invalid('Note at the task’s level', 'Indent it one level under the task it belongs to.', ['T-14'], [], 'note-indent-i');
        else invalid('Note with nothing to belong to', 'A note attaches to a heading or task one level up.', ['T-25', 'T-41'], [], 'note-indent-i');
        return;
      }
      var parent = owner(depth);
      if (!parent || parent.depth !== depth - 1) invalid('Note with nothing one level up', 'A note sits one level under the heading or task it belongs to.', ['T-25', 'T-41'], [], 'note-indent-i');
    });

    var counts = { lines: lines.length, invalid: 0, tolerated: 0, open: 0, valid: 0 };
    var preview = [];
    lines.forEach(function (r) {
      counts[r.verdict]++;
      if (!r.ok || r.type === 'blank' || r.type === 'meta') return;
      if (r.type === 'title' || r.type === 'heading') preview.push({ kind: r.type, text: r.title });
      else if (r.type === 'sep') preview.push({ kind: 'sep' });
      else if (r.type === 'note') preview.push({ kind: 'note', text: r.text.replace(/^[ \t]+/, ''), depth: r.depth });
      else {
        var root = r;
        while (root.parent != null) root = lines[root.parent];
        preview.push({ kind: 'task', text: r.title, state: STATES[r.state], depth: r.depth, meta: r.meta, inherited: root !== r && root.depth === 0 ? root.meta : [] });
      }
    });

    return {
      counts: counts,
      lines: lines.map(function (r) { return { line: r.line, text: r.text, type: r.type, verdict: r.verdict }; }),
      problems: problems,
      preview: preview,
      hits: hits
    };
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { analyze: analyze };
    if (typeof require === 'function' && require.main === module) {
      var res = analyze(require('fs').readFileSync(0, 'utf8'));
      var out = ['example:', '  counts: ' + JSON.stringify(res.counts)];
      ['lines', 'problems', 'preview'].forEach(function (k) {
        out.push('  ' + k + ':' + (res[k].length ? '' : ' []'));
        res[k].forEach(function (x) { out.push('    - ' + JSON.stringify(x)); });
      });
      out.push('  hits: ' + JSON.stringify(res.hits));
      process.stdout.write(out.join('\n') + '\n');
    }
  }
  if (typeof document === 'undefined') return;

  /* ----- Shared rendering, kept in step with the Hugo templates ----- */

  var ICON = {
    valid: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    tolerated: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M1.5 8.5c2-3.5 3.5 1.5 5.5-1.5s3.5-1.5 5.5-2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    invalid: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    open: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M4.6 5.2a2.4 2.4 0 1 1 3.4 2.2c-.7.3-1 .8-1 1.5v.6" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="7" cy="12" r="1.1" fill="currentColor"/></svg>'
  };
  var WORD = { valid: 'Canonical', tolerated: 'Tolerated', invalid: 'Invalid', open: 'Open' };
  var TYPE_WORD = { title: 'title', heading: 'heading', task: 'task', meta: 'metadata', note: 'note', sep: 'separator', blank: 'blank' };
  var BOX = {
    open: '',
    done: '<svg viewBox="0 0 14 14"><path d="M2.5 7.5l3 3 6-7" fill="none" stroke="#FFFFFF" stroke-width="2.4"/></svg>',
    deferred: '<svg viewBox="0 0 10 10"><path d="M3 1.5l4 3.5-4 3.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    canceled: '<span class="pv-dash"></span>'
  };

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function ticks(s) { return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>'); }
  function verdict(v) { return '<span class="verdict verdict--' + v + '">' + ICON[v] + WORD[v] + '</span>'; }
  function linesText(ns) { return (ns.length === 1 ? 'line ' : 'lines ') + ns.join(', '); }

  /* ----- Guide: the annotated file ----- */

  function initGuide(fig) {
    var panel = document.getElementById('sp-panel');
    if (!panel) return;
    var rows = fig.querySelectorAll('[data-line]');
    var noteEls = panel.querySelectorAll('[data-note]');
    var hint = panel.querySelector('[data-sp-hint]');
    var clear = panel.querySelector('[data-sp-clear]');
    var status = panel.querySelector('[data-sp-status]');
    var notes = {};
    var buttons = [];
    var current = null;

    each(noteEls, function (el) { notes[el.getAttribute('data-note')] = el; });

    // Without JS the notes are links to the list below; with JS they become toggle buttons.
    each(fig.querySelectorAll('a.ann'), function (a) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = a.className;
      b.setAttribute('data-note', a.getAttribute('data-note'));
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-controls', 'sp-panel');
      b.innerHTML = a.innerHTML;
      a.parentNode.replaceChild(b, a);
      buttons.push(b);
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-note');
        select(current === id ? null : id);
      });
    });

    function select(id) {
      var note = id ? notes[id] : null;
      current = note ? id : null;
      var targets = note ? note.getAttribute('data-targets').split(' ') : [];
      fig.classList.toggle('has-sel', !!note);
      each(rows, function (row) { row.classList.toggle('is-on', targets.indexOf(row.getAttribute('data-line')) >= 0); });
      buttons.forEach(function (b) {
        var on = b.getAttribute('data-note') === current;
        b.setAttribute('aria-pressed', String(on));
        b.parentNode.classList.toggle('is-pressed', on);
      });
      each(noteEls, function (el) { el.hidden = !!note && el !== note; });
      hint.hidden = !!note;
      clear.hidden = !note;
      panel.classList.toggle('is-docked', !!note);
      if (note) {
        var h = note.querySelector('h3');
        var p = note.querySelector('.sp-note-text');
        status.textContent = (h ? h.textContent : '') + '. ' + (p ? p.textContent : '') + ' Highlighted: ' + linesText(targets) + '.';
      } else {
        status.textContent = '';
      }
    }

    hint.hidden = false;
    clear.addEventListener('click', function () {
      var was = current;
      select(null);
      buttons.forEach(function (b) { if (b.getAttribute('data-note') === was) b.focus(); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && current) select(null);
    });
  }

  /* ----- Atlas: the checker ----- */

  function initChecker(root) {
    var spec = root.getAttribute('data-spec') || '/tasks/v0.1.1/';
    var ta = root.querySelector('textarea');
    var samples = root.querySelector('[data-samples]');
    var sampleBtns = root.querySelectorAll('[data-sample]');
    var summary = root.querySelector('[data-summary]');
    var tbody = root.querySelector('[data-lines]');
    var list = root.querySelector('[data-problems]');
    var preview = root.querySelector('[data-preview]');
    var cells = document.querySelectorAll('[data-cell]');
    var labels = {};
    var timer = null;

    each(cells, function (el) { labels[el.getAttribute('data-cell')] = el.getAttribute('data-label'); });

    function refs(p) {
      var out = [];
      p.rules.forEach(function (id) { out.push('<a class="rid" href="' + spec + '#' + id + '">' + id + '</a>'); });
      p.sections.forEach(function (n) { out.push('<a class="rid" href="' + spec + '#section-' + n + '">§' + n + '</a>'); });
      if (p.cell && labels[p.cell]) out.push('<a href="#cell-' + p.cell + '">Atlas: ' + esc(labels[p.cell]) + '</a>');
      return out.join(' · ');
    }

    function lineRow(l) {
      var text = esc(l.text).replace(/\t/g, '<span class="ws">→</span> ');
      return '<tr class="cl cl--' + l.verdict + '"><td class="num">' + l.line + '</td>' +
        '<td><code class="t-' + l.type + '">' + text + '</code></td>' +
        '<td class="t-' + l.type + '">' + TYPE_WORD[l.type] + '</td>' +
        '<td>' + verdict(l.verdict) + '</td></tr>';
    }

    function problemItem(p) {
      return '<li class="problem">' +
        '<p class="problem-head"><span class="problem-line">Line ' + p.line + '</span> ' + verdict(p.verdict) + ' <span class="problem-title">' + ticks(p.title) + '</span></p>' +
        '<p class="problem-hint">' + ticks(p.hint) + '</p>' +
        '<p class="problem-refs">' + refs(p) + '</p></li>';
    }

    function previewItem(v) {
      if (v.kind === 'title') return '<li class="pv pv--title">' + esc(v.text) + '</li>';
      if (v.kind === 'heading') return '<li class="pv pv--heading">' + esc(v.text) + '</li>';
      if (v.kind === 'sep') return '<li class="pv pv--sep">Archive</li>';
      if (v.kind === 'note') return '<li class="pv pv--note pv-d' + Math.min(v.depth, 6) + '">' + esc(v.text) + '</li>';
      return '<li class="pv pv--task pv--' + v.state + ' pv-d' + Math.min(v.depth, 6) + '">' +
        '<span class="pv-row"><span class="pv-box" aria-hidden="true">' + BOX[v.state] + '</span>' +
        '<span class="pv-title">' + esc(v.text) + '</span> <span class="pv-state">' + v.state + '</span></span>' +
        (v.meta.length ? '<span class="pv-meta">' + esc(v.meta.join(' · ')) + '</span>' : '') +
        (v.inherited.length ? '<span class="pv-inh">inherits ' + esc(v.inherited.join(' · ')) + '</span>' : '') +
        '</li>';
    }

    function run() {
      var r = analyze(ta.value);
      var c = r.counts;
      summary.textContent = c.lines + (c.lines === 1 ? ' line' : ' lines') + ' · ' + c.invalid + ' invalid · ' + c.tolerated + ' tolerated · ' + c.open + ' open';
      tbody.innerHTML = r.lines.map(lineRow).join('');
      list.innerHTML = r.problems.length ? r.problems.map(problemItem).join('') :
        '<li class="problem problem--none"><p class="problem-head">' + verdict('valid') + ' No problems. Every line is canonical.</p></li>';
      preview.innerHTML = r.preview.length ? r.preview.map(previewItem).join('') : '<li class="pv pv--empty">Nothing to show yet.</li>';
      each(cells, function (el) {
        var h = r.hits[el.getAttribute('data-cell')];
        var tag = el.querySelector('[data-hit]');
        el.classList.toggle('is-hit', !!h);
        if (tag) {
          tag.hidden = !h;
          tag.textContent = h ? 'Your file: ' + linesText(h) : '';
        }
      });
      each(sampleBtns, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-sample') === ta.value)); });
    }

    samples.hidden = false;
    each(sampleBtns, function (b) {
      b.addEventListener('click', function () { ta.value = b.getAttribute('data-sample'); run(); });
    });
    ta.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(run, 120);
    });
    run();
  }

  function start() {
    var fig = document.querySelector('[data-tasks-specimen]');
    if (fig) initGuide(fig);
    var checker = document.querySelector('[data-tasks-checker]');
    if (checker) initChecker(checker);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
