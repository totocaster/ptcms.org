/* Plaintext Metrics companion: the file checker and the line builder.
   Written from the Plaintext Metrics 0.2.0 specification. Problems use the check names of §10.
   No dependencies. The page is complete without this script; it makes the two tools live. */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------- the checker

  var FORMAT = /^plaintext-metrics\/(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
  var NAME = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/;
  var LABEL = /^[a-z][a-z0-9_]*$/;
  var AT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(\.\d+)?)?(Z|([+-])(\d{2}):(\d{2}))$/;
  var DATE = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;
  var KINDS = ['quantity', 'count', 'score', 'flag', 'event'];
  var COMBINE = ['sum', 'mean', 'min', 'max', 'last'];
  var HEADER_FIELDS = ['format', 'set', 'by'];
  var DEF_FIELDS = ['define', 'v', 'kind', 'unit', 'min', 'max', 'name', 'about', 'combine', 'labels', 'levels', 'metrics', 'parts', 'was'];
  var RECORD_FIELDS = ['at', 'until', 'date', 'metric', 'v', 'value', 'unit', 'lat', 'lon', 'note', 'of', 'by', 'ref', 'id', 'meta'];
  var EVENT_FIELDS = ['at', 'until', 'date', 'event', 'v', 'lat', 'lon', 'note', 'of', 'by', 'ref', 'id', 'meta'];
  var RESERVED = unique(HEADER_FIELDS.concat(DEF_FIELDS, RECORD_FIELDS, EVENT_FIELDS));
  var TYPE_FIELDS = ['format', 'define', 'metric', 'event'];

  function unique(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function isObj(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }
  function isNum(x) { return typeof x === 'number' && isFinite(x); }
  function isName(x) { return typeof x === 'string' && NAME.test(x); }
  function show(x) { return typeof x === 'string' ? x : JSON.stringify(x); }
  function cite(name, v) { return show(name) + ' v' + show(v); }
  function words(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  function P(level, check, rule, detail) { return { line: 0, level: level, check: check, rule: rule || '', detail: detail }; }

  function daysIn(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }

  // A moment with its offset, as `at` and `until` are written. Returns milliseconds since the epoch, or null.
  function parseAt(s) {
    if (typeof s !== 'string') return null;
    var m = AT.exec(s);
    if (!m) return null;
    var y = +m[1], mo = +m[2], d = +m[3], h = +m[4], mi = +m[5], se = m[6] ? +m[6] : 0;
    if (mo < 1 || mo > 12 || d < 1 || d > daysIn(y, mo) || h > 23 || mi > 59 || se > 59) return null;
    var off = 0;
    if (m[8] !== 'Z') {
      if (+m[10] > 23 || +m[11] > 59) return null;
      off = (+m[10] * 60 + +m[11]) * (m[9] === '-' ? -1 : 1);
    }
    return Date.UTC(y, mo - 1, d, h, mi, se) + (m[7] ? Math.round(parseFloat(m[7]) * 1000) : 0) - off * 60000;
  }

  function validDate(s) {
    if (typeof s !== 'string') return false;
    var m = DATE.exec(s);
    if (!m) return false;
    if (m[2] && (+m[2] < 1 || +m[2] > 12)) return false;
    if (m[3] && (+m[3] < 1 || +m[3] > daysIn(+m[1], +m[2]))) return false;
    return true;
  }

  function unitOk(u) {
    if (typeof u === 'string') return u.length > 0;
    return Array.isArray(u) && u.length > 0 && u.every(function (x) { return typeof x === 'string' && x.length > 0; });
  }

  function deepEqual(a, b) {
    if (a === b) return true;
    if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every(function (x, i) { return deepEqual(x, b[i]); });
    if (isObj(a) && isObj(b)) {
      var ka = Object.keys(a), kb = Object.keys(b);
      return ka.length === kb.length && ka.every(function (k) { return has(b, k) && deepEqual(a[k], b[k]); });
    }
    return false;
  }

  function checkTime(o, out, ruleMissing) {
    if (!has(o, 'at') && !has(o, 'date')) out.push(P('error', 'missing_field', ruleMissing, 'Needs at or date: when it happened.'));
    var a = null;
    if (has(o, 'at')) {
      a = parseAt(o.at);
      if (a === null) out.push(P('error', 'bad_value', 'M-45', 'at must be a date and a time with an offset from UTC, such as 2026-11-26T08:10+01:00. It is ' + show(o.at) + '.'));
    }
    if (has(o, 'date') && !validDate(o.date)) out.push(P('error', 'bad_value', 'M-47', 'date must be a day (2026-11-26), a month (2026-11) or a year (2026). It is ' + show(o.date) + '.'));
    if (has(o, 'until')) {
      if (!has(o, 'at')) {
        out.push(P('error', 'bad_span', 'M-48', 'until appears without at. A span starts at at.'));
      } else {
        var u = parseAt(o.until);
        if (u === null) out.push(P('error', 'bad_value', 'M-48', 'until must be a date and a time with an offset, written like at. It is ' + show(o.until) + '.'));
        else if (a !== null && u < a) out.push(P('error', 'bad_span', 'M-48', 'until (' + o.until + ') is earlier than at (' + o.at + ').'));
      }
    }
  }

  function checkPlace(o, out) {
    if (has(o, 'lat') !== has(o, 'lon')) out.push(P('error', 'missing_field', 'M-55', 'lat and lon come together.'));
    [['lat', 90], ['lon', 180]].forEach(function (f) {
      if (has(o, f[0]) && !(isNum(o[f[0]]) && o[f[0]] >= -f[1] && o[f[0]] <= f[1])) {
        out.push(P('error', 'bad_value', 'M-55', f[0] + ' must be a number from -' + f[1] + ' to ' + f[1] + '. It is ' + show(o[f[0]]) + '.'));
      }
    });
  }

  function checkMeta(o, out) {
    if (has(o, 'meta') && !isObj(o.meta)) out.push(P('error', 'bad_value', 'M-59', 'meta must be a JSON object.'));
  }

  // Checks that need only the line itself.
  function checkLine(o) {
    var out = [];
    var present = TYPE_FIELDS.filter(function (f) { return has(o, f); });
    if (present.length !== 1) {
      return {
        type: null,
        problems: [P('error', 'bad_line', 'M-15', present.length
          ? 'The line has both ' + words(present) + '. A line has exactly one of format, define, metric and event.'
          : 'The line has none of format, define, metric and event, so it is no kind of line.')]
      };
    }
    var kind = present[0];

    if (kind === 'format') {
      ['format', 'set'].forEach(function (f) {
        if (typeof o[f] !== 'string' || !o[f]) out.push(P('error', 'missing_field', 'M-19', 'The header needs ' + f + '.'));
      });
      if (typeof o.format === 'string' && o.format && !FORMAT.test(o.format)) {
        out.push(P('error', 'bad_value', 'M-20', 'format must be plaintext-metrics/ and a three-number version, such as plaintext-metrics/0.2.0. It is ' + o.format + '.'));
      }
      Object.keys(o).forEach(function (f) {
        if (HEADER_FIELDS.indexOf(f) < 0) out.push(P('warning', 'undeclared_label', '', f + ' is not a field of a header line.'));
      });
      return { type: 'header', problems: out };
    }

    var ruleMissing = kind === 'define' ? 'M-24' : kind === 'metric' ? 'M-42' : 'M-61';
    if (!has(o, 'v')) out.push(P('error', 'missing_field', ruleMissing, 'No v: the line must say which version of the definition it means.'));
    else if (!(Number.isInteger(o.v) && o.v >= 1)) out.push(P('error', 'bad_value', 'M-26', 'v must be a whole number, 1 or higher. It is ' + show(o.v) + '.'));

    if (kind === 'define') {
      if (!isName(o.define)) out.push(P('error', 'bad_value', 'M-25', 'define must be lowercase words separated by dots, such as room.temperature. It is ' + show(o.define) + '.'));
      var k = o.kind;
      if (!has(o, 'kind')) out.push(P('error', 'missing_field', 'M-24', 'No kind: the definition must say how to read the number.'));
      else if (KINDS.indexOf(k) < 0) out.push(P('error', 'bad_value', 'M-27', 'kind must be quantity, count, score, flag or event. It is ' + show(k) + '.'));
      if (has(o, 'unit') && !unitOk(o.unit)) out.push(P('error', 'bad_value', 'M-35', 'unit must be one unit code, or a list of unit codes.'));
      else if (k === 'quantity' && !has(o, 'unit')) out.push(P('error', 'missing_field', 'M-33', 'A quantity needs a unit, or a list of units.'));
      if (k === 'quantity' && !has(o, 'combine')) out.push(P('error', 'missing_field', 'M-78', 'A quantity needs combine: whether its values add up (sum) or average (mean), or take the min, max or last.'));
      if (k === 'score') {
        if (!isNum(o.min) || !isNum(o.max)) out.push(P('error', 'missing_field', 'M-34', 'A score needs a number in min and a number in max.'));
        else if (!(o.min < o.max)) out.push(P('error', 'bad_value', 'M-34', 'min (' + o.min + ') must be lower than max (' + o.max + ').'));
      }
      if (has(o, 'combine') && COMBINE.indexOf(o.combine) < 0) out.push(P('error', 'bad_value', 'M-37', 'combine must be sum, mean, min, max or last. It is ' + show(o.combine) + '.'));
      if (has(o, 'labels')) {
        if (!isObj(o.labels)) {
          out.push(P('error', 'bad_value', 'M-40', 'labels must be an object: each label name with its allowed values.'));
        } else {
          Object.keys(o.labels).forEach(function (name) {
            if (RESERVED.indexOf(name) >= 0) out.push(P('error', 'bad_value', 'M-41', 'The label ' + name + ' has the name of a field of the format.'));
            else if (!LABEL.test(name)) out.push(P('error', 'bad_value', 'M-40', 'The label name ' + show(name) + ' must be one lowercase word.'));
            var allowed = o.labels[name];
            if (!(allowed === 'text' || allowed === 'number' || (Array.isArray(allowed) && allowed.length > 0))) {
              out.push(P('error', 'bad_value', 'M-40', 'The label ' + name + ' must declare a list of allowed values, or the word text or number.'));
            }
          });
        }
      }
      Object.keys(o).forEach(function (f) {
        if (DEF_FIELDS.indexOf(f) < 0) out.push(P('warning', 'undeclared_label', '', f + ' is not a field of a definition line.'));
      });
      return { type: 'definition', problems: out };
    }

    if (kind === 'metric') {
      if (!isName(o.metric)) out.push(P('error', 'bad_value', 'M-25', 'metric must be a name: lowercase words separated by dots. It is ' + show(o.metric) + '.'));
      if (!has(o, 'value')) out.push(P('error', 'missing_field', 'M-42', 'No value: a record states one number.'));
      else if (!isNum(o.value)) out.push(P('error', 'bad_value', 'M-43', 'value must be a JSON number, such as 7.4, not ' + JSON.stringify(o.value) + '.'));
      checkTime(o, out, 'M-42');
      checkPlace(o, out);
      checkMeta(o, out);
      return { type: 'record', problems: out };
    }

    if (!isName(o.event)) out.push(P('error', 'bad_value', 'M-25', 'event must be a name: lowercase words separated by dots. It is ' + show(o.event) + '.'));
    if (!has(o, 'id')) out.push(P('error', 'missing_field', 'M-61', 'An event needs an id, for its records to name in of.'));
    else if (typeof o.id !== 'string' || !o.id) out.push(P('error', 'bad_value', 'M-61', 'An event id must be a string.'));
    if (has(o, 'value')) out.push(P('error', 'bad_value', 'M-62', 'An event has no value. Its numbers are records that name it in of.'));
    checkTime(o, out, 'M-61');
    checkPlace(o, out);
    checkMeta(o, out);
    return { type: 'event', problems: out };
  }

  function checkLabels(o, d, fields, out, defName) {
    var declared = isObj(d.labels) ? d.labels : {};
    Object.keys(o).forEach(function (f) {
      if (fields.indexOf(f) >= 0) return;
      if (!has(declared, f)) {
        out.push(P('warning', 'undeclared_label', 'M-53', f + ' is not a field of the format, and ' + defName + ' does not declare it as a label. The field is kept.'));
        return;
      }
      var allowed = declared[f], val = o[f];
      var ok = (allowed === 'text' && typeof val === 'string') ||
        (allowed === 'number' && isNum(val)) ||
        (Array.isArray(allowed) && allowed.some(function (x) { return x === val; }));
      if (!ok) {
        out.push(P('error', 'bad_value', 'M-54', f + ' is ' + JSON.stringify(val) + ', which ' + defName + ' does not allow' +
          (Array.isArray(allowed) ? ': it allows ' + words(allowed.map(show)) : ': it takes a ' + allowed) + '.'));
      }
    });
  }

  // Check a whole file. Lines are numbered as they are in the file, blank lines included.
  function checkFile(text) {
    var rows = String(text == null ? '' : text).split('\n');
    if (rows.length && rows[rows.length - 1] === '') rows.pop();
    var problems = [], notes = [], parsed = [], seen = Object.create(null), count = 0;

    function add(n, p) { p.line = n; problems.push(p); }

    rows.forEach(function (raw, i) {
      var n = i + 1, line = raw.replace(/\r$/, '');
      if (!line.trim()) return; // M-6
      count++;
      if (seen[line]) { // M-9
        notes.push({ line: n, rule: 'M-9', detail: 'Line ' + n + ' repeats line ' + seen[line] + ' exactly, so it is read as that one line.' });
        return;
      }
      seen[line] = n;
      var o;
      try { o = JSON.parse(line); } catch (e) { o = undefined; }
      if (!isObj(o)) {
        if (line.charCodeAt(0) === 0xFEFF) add(n, P('error', 'bad_json', 'M-2', 'The line starts with a byte order mark.'));
        else add(n, P('error', 'bad_json', 'M-5', o === undefined ? 'The line is not valid JSON.' : 'The line is JSON, but not an object.'));
        return;
      }
      var r = checkLine(o);
      r.problems.forEach(function (p) { add(n, p); });
      if (r.type) parsed.push({ n: n, type: r.type, o: o });
    });

    var headers = parsed.filter(function (p) { return p.type === 'header'; });
    if (headers.length !== 1) {
      add(0, P('error', 'header', 'M-16', headers.length
        ? 'The file has ' + headers.length + ' header lines (lines ' + words(headers.map(function (h) { return String(h.n); })) + '). It must have exactly one.'
        : 'The file has no header line: no line has format.'));
    }

    var defs = Object.create(null);
    parsed.forEach(function (p) {
      if (p.type !== 'definition') return;
      var key = JSON.stringify([p.o.define, p.o.v]);
      if (defs[key] && !deepEqual(defs[key].o, p.o)) {
        add(p.n, P('error', 'definition_conflict', 'M-29', cite(p.o.define, p.o.v) + ' is already defined on line ' + defs[key].n + ', differently. A change of meaning needs a new version.'));
      }
      defs[key] = { o: p.o, n: p.n };
    });
    function def(name, v) { var d = defs[JSON.stringify([name, v])]; return d ? d.o : null; }

    var events = Object.create(null), ids = Object.create(null), refs = Object.create(null);
    parsed.forEach(function (p) {
      var o = p.o;
      if (p.type !== 'record' && p.type !== 'event') return;
      if (has(o, 'id')) {
        // Both lines that share an id are in error, so a reader ignores both (§12, question 4).
        var ik = JSON.stringify(o.id), first = ids[ik];
        if (first) {
          if (!first.flagged) { first.flagged = true; add(first.n, P('error', 'duplicate_id', 'M-57', 'The id ' + show(o.id) + ' is used again on line ' + p.n + '.')); }
          add(p.n, P('error', 'duplicate_id', 'M-57', 'The id ' + show(o.id) + ' is already used on line ' + first.n + '.'));
        } else {
          ids[ik] = { n: p.n, flagged: false };
        }
      }
      if (has(o, 'by') && has(o, 'ref')) {
        var rk = JSON.stringify([o.by, o.ref]);
        if (refs[rk]) add(p.n, P('warning', 'duplicate_ref', 'M-58', 'by ' + show(o.by) + ' and ref ' + show(o.ref) + ' already appear together on line ' + refs[rk] + ': probably the same item imported twice.'));
        refs[rk] = p.n;
      }
      if (p.type === 'event') events[JSON.stringify(o.id)] = o;
    });

    parsed.forEach(function (p) {
      var o = p.o, out = [], d;
      if (p.type === 'record') {
        d = def(o.metric, o.v);
        if (!d || d.kind === 'event') {
          add(p.n, d
            ? P('error', 'undefined', 'M-63', cite(o.metric, o.v) + ' is an event type. A record cites a metric, never an event definition.')
            : P('error', 'undefined', 'M-10', 'It cites ' + cite(o.metric, o.v) + ', which this file does not define.'));
          return;
        }
        var name = cite(o.metric, o.v), v = o.value, k = d.kind;
        if (isNum(v)) {
          if (k === 'score' && isNum(d.min) && isNum(d.max) && !(v >= d.min && v <= d.max)) add(p.n, P('error', 'out_of_range', 'M-44', v + ' is outside ' + name + ', a score from ' + d.min + ' to ' + d.max + '.'));
          if (k === 'count' && (v < 0 || !Number.isInteger(v))) add(p.n, P('error', 'out_of_range', 'M-44', v + ' is not a whole number of zero or more, as ' + name + ', a count, needs.'));
          if (k === 'flag' && v !== 0 && v !== 1) add(p.n, P('error', 'out_of_range', 'M-44', v + ' is not 0 or 1, as ' + name + ', a flag, needs.'));
        }
        var du = d.unit, allowed = Array.isArray(du) ? du : [du];
        if (Array.isArray(du) && du.length > 1 && !has(o, 'unit')) add(p.n, P('error', 'unit_mismatch', 'M-51', name + ' lists ' + words(du) + ', so the record must say which unit it uses.'));
        else if (has(o, 'unit') && allowed.indexOf(o.unit) < 0) add(p.n, P('error', 'unit_mismatch', 'M-51', show(o.unit) + ' is not a unit ' + name + ' allows' + (du === undefined ? '' : ': it allows ' + words(allowed.map(show))) + '.'));
        checkLabels(o, d, RECORD_FIELDS, out, name);
      } else if (p.type === 'event') {
        d = def(o.event, o.v);
        if (!d || d.kind !== 'event') {
          add(p.n, d
            ? P('error', 'undefined', 'M-63', cite(o.event, o.v) + ' is not an event type: its kind is ' + show(d.kind) + '.')
            : P('error', 'undefined', 'M-10', 'It cites the event type ' + cite(o.event, o.v) + ', which this file does not define.'));
          return;
        }
        checkLabels(o, d, EVENT_FIELDS, out, cite(o.event, o.v));
      } else {
        return;
      }
      out.forEach(function (q) { add(p.n, q); });
      if (has(o, 'of')) {
        var parent = events[JSON.stringify(o.of)];
        if (!parent) {
          add(p.n, P('warning', 'missing_event', 'M-64', 'of names ' + show(o.of) + ', and no event line has that id. A reader ignores this of and keeps the line.'));
          return;
        }
        var pd = def(parent.event, parent.v) || {};
        if (p.type === 'event' && Array.isArray(pd.parts) && pd.parts.length && pd.parts.indexOf(o.event) < 0) {
          add(p.n, P('warning', 'undeclared_label', 'M-67', show(o.event) + ' is not one of the parts ' + show(parent.event) + ' lists.'));
        }
        if (p.type === 'record' && Array.isArray(pd.metrics) && pd.metrics.length && pd.metrics.indexOf(o.metric) < 0) {
          add(p.n, P('warning', 'undeclared_label', 'M-67', show(o.metric) + ' is not one of the metrics ' + show(parent.event) + ' lists.'));
        }
      }
    });

    problems = problems.map(function (p, i) { p._i = i; return p; })
      .sort(function (a, b) { return a.line - b.line || a._i - b._i; })
      .map(function (p) { delete p._i; return p; });
    var errors = problems.filter(function (p) { return p.level === 'error'; }).length;
    // M-76: a reader leaves out every line with an error. A line with only warnings is still used.
    var ignored = unique(problems.filter(function (p) { return p.level === 'error' && p.line > 0; }).map(function (p) { return p.line; }));
    return {
      lines: count,
      ignored: ignored,
      problems: problems,
      notes: notes,
      errors: errors,
      warnings: problems.length - errors,
      verdict: errors ? 'invalid' : problems.length ? 'tolerated' : 'valid'
    };
  }

  // ---------------------------------------------------------------- the builder

  var DEF_ORDER = DEF_FIELDS;
  var REC_HEAD = ['at', 'until', 'date', 'metric', 'v', 'value', 'unit'];
  var REC_TAIL = ['lat', 'lon', 'note', 'of', 'by', 'ref', 'id', 'meta'];

  function pick(o, keys, out) { keys.forEach(function (k) { if (has(o, k)) out[k] = o[k]; }); return out; }

  // M-74: the fact first. Labels sit after unit; any other field keeps its place among them.
  function canonicalRecord(o) {
    var out = pick(o, REC_HEAD, {});
    Object.keys(o).forEach(function (k) { if (REC_HEAD.indexOf(k) < 0 && REC_TAIL.indexOf(k) < 0) out[k] = o[k]; });
    return pick(o, REC_TAIL, out);
  }

  // The specification fixes an order for records only. Definitions follow the order of its field table (§6.1).
  function canonicalDefinition(o) {
    var out = pick(o, DEF_ORDER, {});
    Object.keys(o).forEach(function (k) { if (DEF_ORDER.indexOf(k) < 0) out[k] = o[k]; });
    return out;
  }

  // A typed value becomes JSON: 7.4 is a number, "7.4" (with quotes) or seven is a string.
  function typed(text) {
    var t = String(text).trim();
    if (t === '') return undefined;
    try {
      var x = JSON.parse(t);
      if (x === null || typeof x !== 'object') return x;
    } catch (e) { /* not JSON: a word */ }
    return t;
  }

  function list(text) { return String(text).split(',').map(function (s) { return s.trim(); }).filter(Boolean); }

  function buildDefinition(s, carry) {
    var o = {};
    if (s.define.trim()) o.define = s.define.trim();
    if (typed(s.dv) !== undefined) o.v = typed(s.dv);
    if (s.kind) o.kind = s.kind;
    var units = list(s.dunit);
    if (units.length) o.unit = units.length > 1 ? units : units[0];
    if (typed(s.min) !== undefined) o.min = typed(s.min);
    if (typed(s.max) !== undefined) o.max = typed(s.max);
    if (s.name.trim()) o.name = s.name.trim();
    Object.keys(carry || {}).forEach(function (k) { if (!has(o, k)) o[k] = carry[k]; });
    if (s.combine) o.combine = s.combine;
    var ln = s.lname.trim();
    if (ln) {
      var lv = s.lvalues.trim();
      o.labels = {};
      o.labels[ln] = (lv === 'text' || lv === 'number') ? lv : list(lv).map(function (x) { return /^-?\d+(\.\d+)?$/.test(x) ? Number(x) : x; });
    }
    return canonicalDefinition(o);
  }

  function buildRecord(s, def) {
    var o = {};
    ['at', 'until', 'date'].forEach(function (k) { if (s[k].trim()) o[k] = s[k].trim(); });
    if (def.define !== undefined) o.metric = def.define;
    if (typed(s.rv) !== undefined) o.v = typed(s.rv);
    if (typed(s.value) !== undefined) o.value = typed(s.value);
    if (s.runit.trim()) o.unit = s.runit.trim();
    var ln = s.rlabel.trim(), lv = s.rlabelvalue.trim();
    if (ln && lv) {
      var decl = isObj(def.labels) ? def.labels[ln] : undefined;
      o[ln] = decl === 'number' || (Array.isArray(decl) && decl.some(isNum)) ? typed(lv) : lv;
    }
    ['note', 'by', 'ref'].forEach(function (k) { if (s[k].trim() && !has(o, k)) o[k] = s[k].trim(); });
    return canonicalRecord(o);
  }

  function minutesBetween(a, b) { return Math.round((parseAt(b) - parseAt(a)) / 60000); }

  // One row per check the builder runs, in a fixed order, whether it passes or not.
  var PLAN = [
    { line: 2, part: 'Definition', check: 'missing_field' },
    { line: 2, part: 'Definition', check: 'bad_value' },
    { line: 3, part: 'Record', check: 'missing_field' },
    { line: 3, part: 'Record', check: 'bad_value' },
    { line: 3, part: 'Record', check: 'undefined' },
    { line: 3, part: 'Record', check: 'out_of_range', needsDef: true },
    { line: 3, part: 'Record', check: 'unit_mismatch', needsDef: true },
    { line: 3, part: 'Record', check: 'bad_span' },
    { line: 3, part: 'Record', check: 'undeclared_label', needsDef: true }
  ];

  function passed(check, part, d, r) {
    var kind = d.kind, rules, text;
    if (part === 'Definition' && check === 'missing_field') {
      rules = ['M-24']; text = 'define, v and kind are present';
      if (kind === 'quantity') { rules.push('M-33', 'M-78'); text += ', with the unit and combine a quantity needs'; }
      if (kind === 'score') { rules.push('M-34'); text += ', with the min and max a score needs'; }
      return { rules: rules, detail: text + '.' };
    }
    if (part === 'Definition' && check === 'bad_value') {
      rules = ['M-25', 'M-26', 'M-27']; var parts = ['name', 'version', 'kind'];
      if (has(d, 'unit')) { rules.push('M-35'); parts.push('unit'); }
      if (has(d, 'combine')) { rules.push('M-37'); parts.push('combine'); }
      if (has(d, 'labels')) { rules.push('M-40'); parts.push('labels'); }
      return { rules: rules, detail: 'The ' + words(parts) + ' are well formed.' };
    }
    if (check === 'missing_field') {
      var when = has(r, 'at') && has(r, 'date') ? 'both at and date' : has(r, 'at') ? 'at' : 'date';
      return { rules: ['M-42'], detail: 'metric, v, value and ' + when + ' are present.' };
    }
    if (check === 'bad_value') {
      rules = ['M-43']; text = 'value is the number ' + JSON.stringify(r.value);
      if (has(r, 'at')) { rules.push('M-45'); text += '; at has a date, a time and an offset'; }
      if (has(r, 'date')) { rules.push('M-47'); text += '; date is a ' + (r.date.length === 10 ? 'day' : r.date.length === 7 ? 'month' : 'year'); }
      var labels = Object.keys(r).filter(function (k) { return RESERVED.indexOf(k) < 0 && isObj(d.labels) && has(d.labels, k); });
      if (labels.length) { rules.push('M-54'); text += '; ' + words(labels) + ' takes an allowed value'; }
      return { rules: rules, detail: text + '.' };
    }
    if (check === 'undefined') return { rules: ['M-10'], detail: 'It cites ' + cite(r.metric, r.v) + ', which the definition above provides.' };
    if (check === 'out_of_range') {
      if (kind === 'score') return { rules: ['M-44'], detail: 'value is ' + r.value + ', within the score\'s ' + d.min + ' to ' + d.max + '.' };
      if (kind === 'count') return { rules: ['M-44'], detail: 'value is ' + r.value + ', a whole number of zero or more, as a count needs.' };
      if (kind === 'flag') return { rules: ['M-44'], detail: 'value is ' + r.value + ', and a flag is 0 or 1.' };
      return { rules: ['M-44'], detail: 'A quantity is any number. It has no bounds.' };
    }
    if (check === 'unit_mismatch') {
      if (Array.isArray(d.unit)) return { rules: ['M-51'], detail: r.unit + ' is one of the units the definition lists.' };
      if (typeof d.unit === 'string') return { rules: ['M-51'], detail: has(r, 'unit') ? 'unit is ' + r.unit + ', the only unit the definition allows.' : 'The definition states one unit, ' + d.unit + ', so the record need not.' };
      return { rules: ['M-51'], detail: has(r, 'unit') ? 'The definition states no unit to compare with.' : 'Neither the definition nor the record states a unit.' };
    }
    if (check === 'bad_span') {
      if (!has(r, 'until')) return { rules: ['M-48'], detail: 'No until, so there is no span to check.' };
      var mins = minutesBetween(r.at, r.until);
      return { rules: ['M-48'], detail: 'until is ' + mins + ' minute' + (mins === 1 ? '' : 's') + ' after at.' };
    }
    if (check === 'undeclared_label') {
      var extra = Object.keys(r).filter(function (k) { return RESERVED.indexOf(k) < 0; });
      return { rules: ['M-53'], detail: extra.length ? words(extra) + (extra.length > 1 ? ' are labels' : ' is a label') + ' the definition declares.' : 'Every field is a field of the format.' };
    }
    return { rules: [], detail: '' };
  }

  // Build the three-line file, check it, and explain every check in plain words.
  function build(s, carry, set) {
    var header = { format: 'plaintext-metrics/0.2.0', set: set || 'ada/journal' };
    var d = buildDefinition(s, carry);
    var r = buildRecord(s, d);
    var lines = [header, d, r].map(function (o) { return JSON.stringify(o); });
    var result = checkFile(lines.join('\n') + '\n');
    var undefinedHit = result.problems.some(function (p) { return p.line === 3 && p.check === 'undefined'; });
    var used = [];
    var rows = [];
    PLAN.forEach(function (step) {
      var hits = result.problems.filter(function (p, i) {
        if (p.line === step.line && p.check === step.check) { used.push(i); return true; }
        return false;
      });
      if (hits.length) {
        hits.forEach(function (p) { rows.push({ part: step.part, check: p.check, rules: p.rule ? [p.rule] : [], status: p.level, detail: p.detail }); });
      } else if (step.needsDef && undefinedHit) {
        rows.push({ part: step.part, check: step.check, rules: [], status: 'skip', detail: 'Not run: the record cites no definition in this file.' });
      } else {
        var pass = passed(step.check, step.part, d, r);
        rows.push({ part: step.part, check: step.check, rules: pass.rules, status: 'ok', detail: pass.detail });
      }
    });
    result.problems.forEach(function (p, i) {
      if (used.indexOf(i) < 0) rows.push({ part: p.line === 2 ? 'Definition' : p.line === 3 ? 'Record' : 'File', check: p.check, rules: p.rule ? [p.rule] : [], status: p.level, detail: p.detail });
    });
    var notes = [];
    if (has(r, 'unit') && typeof d.unit === 'string') {
      notes.push({ rule: 'M-50', detail: 'The definition states a single unit, so a writer should leave unit off the record. No check in §10 reports this.' });
    }
    return { lines: lines, objects: [header, d, r], result: result, rows: rows, notes: notes };
  }

  function summary(result) {
    if (result.verdict === 'valid') return 'Valid. No problems.';
    var names = unique(result.problems.map(function (p) { return p.check; }));
    var parts = [];
    if (result.errors) parts.push(result.errors + ' error' + (result.errors > 1 ? 's' : ''));
    if (result.warnings) parts.push(result.warnings + ' warning' + (result.warnings > 1 ? 's' : ''));
    var text = (result.verdict === 'invalid' ? 'Invalid' : 'Tolerated') + ': ' + words(parts) + ' (' + names.join(', ') + ').';
    if (result.ignored && result.ignored.length) text += ' Readers ignore line' + (result.ignored.length > 1 ? 's ' : ' ') + words(result.ignored.map(String)) + '.';
    else if (result.verdict === 'tolerated') text += ' Every line is still used.';
    return text;
  }

  var core = {
    checkFile: checkFile,
    checkLine: checkLine,
    canonicalRecord: canonicalRecord,
    canonicalDefinition: canonicalDefinition,
    buildDefinition: buildDefinition,
    buildRecord: buildRecord,
    build: build,
    summary: summary,
    typed: typed
  };

  if (typeof module === 'object' && module.exports) { module.exports = core; return; }
  root.PlaintextMetrics = core;
  if (typeof document === 'undefined') return;

  // ---------------------------------------------------------------- the page

  var dataEl = document.getElementById('metrics-guide-data');
  if (!dataEl) return;
  var DATA;
  try { DATA = JSON.parse(dataEl.textContent); } catch (e) { return; }
  var ROLES = DATA.roles || {};
  var SPEC = DATA.spec || '/metrics/v0.2.0/';

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function role(k) { return ROLES[k] || 'annot'; }

  function lineHTML(o) {
    var parts = Object.keys(o).map(function (k) {
      return '<span class="f-' + role(k) + '">' + esc(JSON.stringify(k) + ':' + JSON.stringify(o[k])) + '</span>';
    });
    return '<span class="j-p">{</span>' + parts.join('<span class="j-p">,</span>') + '<span class="j-p">}</span>';
  }

  var ICONS = {
    valid: '<path d="M2.5 7.5l3 3 6-7"/>',
    ok: '<path d="M2.5 7.5l3 3 6-7"/>',
    invalid: '<path d="M3 3l8 8M11 3l-8 8"/>',
    error: '<path d="M3 3l8 8M11 3l-8 8"/>',
    tolerated: '<path d="M1.5 8.5c1.5-3 3-3 4.5 0s3 3 4.5 0 2-2.2 2.5-1.5"/>',
    warning: '<path d="M1.5 8.5c1.5-3 3-3 4.5 0s3 3 4.5 0 2-2.2 2.5-1.5"/>',
    skip: '<path d="M3 7h8"/>'
  };
  var WORDS = { valid: 'Valid', invalid: 'Invalid', tolerated: 'Tolerated', ok: 'OK', error: 'Error', warning: 'Warning', skip: 'Not run' };
  var TONE = { valid: 'valid', ok: 'valid', invalid: 'invalid', error: 'invalid', tolerated: 'tolerated', warning: 'tolerated', skip: 'open' };

  function badge(state) {
    return '<span class="verdict verdict--' + TONE[state] + '"><svg viewBox="0 0 14 14" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' + ICONS[state] + '</svg>' + WORDS[state] + '</span>';
  }
  function ruleLinks(rules) {
    return rules.length ? rules.map(function (r) { return '<a class="mono m-rule" href="' + SPEC + '#' + r + '">' + r + '</a>'; }).join(' ') : '<span class="m-none">none</span>';
  }

  function enable(scope) {
    Array.prototype.forEach.call(scope.querySelectorAll('[data-js-only]'), function (el) { el.hidden = false; });
    Array.prototype.forEach.call(scope.querySelectorAll('[data-no-js]'), function (el) { el.hidden = true; });
    Array.prototype.forEach.call(scope.querySelectorAll('fieldset[disabled]'), function (el) { el.disabled = false; });
    Array.prototype.forEach.call(scope.querySelectorAll('textarea[readonly]'), function (el) { el.readOnly = false; });
  }

  // ---- The checker

  var checker = document.querySelector('[data-metrics-checker]');
  if (checker) {
    var input = checker.querySelector('textarea');
    var pickEl = checker.querySelector('select');
    var verdictEl = checker.querySelector('[data-checker-verdict]');
    var rowsEl = checker.querySelector('[data-checker-rows]');
    var notesEl = checker.querySelector('[data-checker-notes]');
    var tableEl = checker.querySelector('[data-checker-table]');
    var timer = null;

    var runChecker = function () {
      var r = checkFile(input.value);
      verdictEl.innerHTML = badge(r.verdict) + ' <span class="m-summary">' + esc(r.verdict === 'valid'
        ? 'No problems in ' + r.lines + ' line' + (r.lines === 1 ? '' : 's') + '.'
        : summary(r).replace(/^[A-Za-z]+: /, '')) + '</span>';
      tableEl.hidden = !r.problems.length;
      rowsEl.innerHTML = r.problems.map(function (p) {
        return '<tr><td class="num">' + (p.line ? p.line : 'file') + '</td><td>' + badge(p.level) + '</td><td><code>' + esc(p.check) + '</code></td><td>' + ruleLinks(p.rule ? [p.rule] : []) + '</td><td>' + esc(p.detail) + '</td></tr>';
      }).join('');
      notesEl.innerHTML = r.notes.map(function (n) { return '<li>' + esc(n.detail) + ' ' + ruleLinks([n.rule]) + '</li>'; }).join('');
      notesEl.hidden = !r.notes.length;
    };

    var load = function (name) {
      if (!DATA.files || !has(DATA.files, name)) return;
      input.value = DATA.files[name];
      if (pickEl) pickEl.value = name;
      runChecker();
    };

    enable(checker);
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(runChecker, 120); });
    if (pickEl) pickEl.addEventListener('change', function () { load(pickEl.value); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-load-example]'), function (btn) {
      btn.hidden = false;
      btn.addEventListener('click', function () {
        load(btn.getAttribute('data-load-example'));
        checker.scrollIntoView({ behavior: 'smooth', block: 'start' });
        input.focus({ preventScroll: true });
      });
    });
    runChecker();
  }

  // ---- The builder

  var builder = document.querySelector('[data-metrics-builder]');
  if (builder) {
    var $ = function (id) { return builder.querySelector('#b-' + id); };
    var IDS = ['define', 'dv', 'kind', 'dunit', 'min', 'max', 'name', 'combine', 'lname', 'lvalues',
      'at', 'until', 'date', 'rv', 'value', 'runit', 'rlabel', 'rlabelvalue', 'note', 'by', 'ref'];
    var FORM_DEF = ['define', 'v', 'kind', 'unit', 'min', 'max', 'name', 'combine', 'labels'];
    var carry = {};
    var presets = {};
    (DATA.presets || []).forEach(function (p) { presets[p.key] = JSON.parse(p.line); });

    var state = function () {
      var s = {};
      IDS.forEach(function (id) { var el = $(id); s[id] = el ? el.value : ''; });
      return s;
    };
    var set = function (id, v) { var el = $(id); if (el) el.value = v === undefined || v === null ? '' : String(v); };
    var text = function (v) { return v === undefined ? '' : typeof v === 'string' ? v : JSON.stringify(v); };

    var applyPreset = function (key, keepRecord, own) {
      var d = own || presets[key];
      if (!d) { carry = {}; return; }
      set('define', d.define); set('dv', d.v); set('kind', d.kind);
      set('dunit', Array.isArray(d.unit) ? d.unit.join(', ') : d.unit);
      set('min', d.min); set('max', d.max); set('name', d.name); set('combine', d.combine);
      var ln = isObj(d.labels) ? Object.keys(d.labels)[0] : '';
      set('lname', ln);
      set('lvalues', ln ? (Array.isArray(d.labels[ln]) ? d.labels[ln].join(', ') : d.labels[ln]) : '');
      carry = {};
      Object.keys(d).forEach(function (k) { if (FORM_DEF.indexOf(k) < 0) carry[k] = d[k]; });
      if (!keepRecord) {
        set('rv', d.v);
        set('runit', Array.isArray(d.unit) ? d.unit[0] : '');
        set('rlabel', ln);
        set('rlabelvalue', ln && Array.isArray(d.labels[ln]) ? d.labels[ln][0] : '');
      }
    };

    var loadExample = function (ex) {
      var sel = $('preset');
      var own = ex.definition ? JSON.parse(ex.definition) : null;
      if (sel) sel.value = own ? '' : ex.preset;
      applyPreset(ex.preset, true, own);
      var r = JSON.parse(ex.record);
      ['at', 'until', 'date', 'note', 'by', 'ref'].forEach(function (k) { set(k, r[k]); });
      set('rv', r.v === undefined ? '' : JSON.stringify(r.v));
      set('value', r.value === undefined ? '' : JSON.stringify(r.value));
      set('runit', r.unit);
      var label = Object.keys(r).filter(function (k) { return RESERVED.indexOf(k) < 0; })[0];
      set('rlabel', label || ''); set('rlabelvalue', label ? text(r[label]) : '');
    };

    var fileEl = builder.querySelector('[data-builder-file]');
    var verdictB = builder.querySelector('[data-builder-verdict]');
    var rowsB = builder.querySelector('[data-builder-rows]');
    var notesB = builder.querySelector('[data-builder-notes]');

    var update = function () {
      var out = build(state(), carry, DATA.set);
      fileEl.innerHTML = out.objects.map(lineHTML).join('\n');
      verdictB.innerHTML = badge(out.result.verdict) + ' <span class="m-summary">' + esc(out.result.verdict === 'valid'
        ? 'The record is valid.'
        : summary(out.result).replace(/^[A-Za-z]+: /, '')) + '</span>';
      rowsB.innerHTML = out.rows.map(function (row) {
        return '<tr><td>' + badge(row.status) + '</td><td>' + row.part + '</td><td><code>' + esc(row.check) + '</code></td><td>' + ruleLinks(row.rules) + '</td><td>' + esc(row.detail) + '</td></tr>';
      }).join('');
      notesB.innerHTML = out.notes.map(function (n) { return '<li>' + esc(n.detail) + ' ' + ruleLinks([n.rule]) + '</li>'; }).join('');
      notesB.hidden = !out.notes.length;
    };

    // Pick up the preset the page was rendered with, so its extra fields (such as about) are kept.
    var presetSel = $('preset');
    if (presetSel && presets[presetSel.value]) {
      var d0 = presets[presetSel.value];
      Object.keys(d0).forEach(function (k) { if (FORM_DEF.indexOf(k) < 0) carry[k] = d0[k]; });
    }

    enable(builder);
    builder.addEventListener('input', function (e) { if (e.target !== presetSel) update(); });
    builder.addEventListener('submit', function (e) { e.preventDefault(); });
    if (presetSel) presetSel.addEventListener('change', function () { if (presets[presetSel.value]) { applyPreset(presetSel.value, false); update(); } });
    Array.prototype.forEach.call(builder.querySelectorAll('[data-builder-example]'), function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-builder-example');
        var ex = (DATA.examples || []).filter(function (x) { return x.key === key; })[0];
        if (ex) { loadExample(ex); update(); }
      });
    });
    update();
  }
})(this);
