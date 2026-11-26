/* On narrow screens the document tree starts folded; it stays open without JavaScript. */
(function () {
  var box = document.querySelector(".tree-box");
  if (box && window.matchMedia && window.matchMedia("(max-width: 900px)").matches) box.open = false;
})();

/* Site search: loads /search.json on first use, matches titles, headings, summaries and rule IDs. */
(function () {
  "use strict";
  var form = document.querySelector("form.search");
  if (!form) return;
  var input = form.querySelector("input[type=search]");
  var list = form.querySelector(".search-results");
  var indexUrl = form.getAttribute("data-index");
  var index = null;
  var loading = null;
  var results = [];
  var active = -1;

  function load() {
    if (index) return Promise.resolve(index);
    if (!loading) {
      loading = fetch(indexUrl, { credentials: "same-origin" })
        .then(function (r) { return r.json(); })
        .then(function (d) { index = d; return d; })
        .catch(function () { index = []; return index; });
    }
    return loading;
  }

  function lc(s) { return (s || "").toLowerCase(); }

  function search(q) {
    q = q.trim();
    if (!q || !index) return [];
    var nq = lc(q);
    var words = nq.split(/\s+/);
    var isRule = /^[a-z]+-\d+$/i.test(q);
    var out = [];
    index.forEach(function (p) {
      if (isRule && p.rules) {
        p.rules.forEach(function (r) {
          if (lc(r.id) === nq) out.push({ score: 200, title: r.id + " · " + p.title, meta: r.text, url: p.url + "#" + r.id });
        });
      }
      var score = 0;
      var title = lc(p.title);
      if (title === nq) score += 60;
      else if (title.indexOf(nq) === 0) score += 40;
      else if (title.indexOf(nq) >= 0) score += 25;
      var heading = null;
      (p.headings || []).forEach(function (h) {
        if (lc(h.title).indexOf(nq) >= 0) { score += 10; if (!heading) heading = h; }
      });
      if (lc(p.summary).indexOf(nq) >= 0) score += 8;
      var text = lc(p.text);
      if (words.every(function (w) { return text.indexOf(w) >= 0; })) score += 4;
      if (score > 0) {
        var deep = heading && score < 25;
        out.push({
          score: score,
          title: deep ? p.title + " › " + heading.title : p.title,
          meta: p.area || "Plaintext Commons",
          url: deep ? p.url + "#" + heading.id : p.url
        });
      }
    });
    out.sort(function (a, b) { return b.score - a.score; });
    return out.slice(0, 8);
  }

  function close() {
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    active = -1;
  }

  function render() {
    list.textContent = "";
    if (!input.value.trim()) { close(); return; }
    if (!results.length) {
      var empty = document.createElement("li");
      empty.className = "r-empty";
      empty.textContent = "Nothing found for “" + input.value.trim() + "”.";
      list.appendChild(empty);
    }
    results.forEach(function (r, i) {
      var li = document.createElement("li");
      li.setAttribute("role", "option");
      var a = document.createElement("a");
      a.href = r.url;
      a.id = "sr-" + i;
      if (i === active) a.setAttribute("aria-selected", "true");
      var t = document.createElement("span");
      t.className = "r-title";
      t.textContent = r.title;
      var m = document.createElement("span");
      m.className = "r-meta";
      m.textContent = r.meta;
      a.appendChild(t);
      a.appendChild(m);
      li.appendChild(a);
      list.appendChild(li);
    });
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  function update() {
    load().then(function () {
      results = search(input.value);
      active = results.length ? 0 : -1;
      render();
    });
  }

  input.addEventListener("focus", load);
  input.addEventListener("input", update);
  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown" && results.length) { e.preventDefault(); active = (active + 1) % results.length; render(); }
    else if (e.key === "ArrowUp" && results.length) { e.preventDefault(); active = (active - 1 + results.length) % results.length; render(); }
    else if (e.key === "Enter") { e.preventDefault(); if (results[active]) window.location.href = results[active].url; }
    else if (e.key === "Escape") { input.value = ""; close(); input.blur(); }
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  document.addEventListener("click", function (e) { if (!form.contains(e.target)) close(); });
  document.addEventListener("keydown", function (e) {
    var tag = (e.target && e.target.tagName) || "";
    if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(tag) && !e.target.isContentEditable) {
      e.preventDefault();
      input.focus();
    }
  });
})();
