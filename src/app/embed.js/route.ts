export async function GET() {
  const base = process.env.NEXT_PUBLIC_SERVER_URL || "";

  const script = `
(function() {
  var BASE = "${base}";

  function init() {
    var el = document.getElementById("verbi");
    if (!el) return;
    var pageKey = el.dataset.pageKey || window.location.pathname;
    var pageTitle = el.dataset.pageTitle || document.title;
    var site = el.dataset.site || "default";
    var server = el.dataset.server || BASE;

    var tw = document.createElement("script");
    tw.src = "https://cdn.tailwindcss.com";
    tw.onload = function() {
      tailwind.config = {
        important: "#verbi-root",
        corePlugins: { preflight: false },
      };
      render(root, cfg);
    };
    document.head.appendChild(tw);

    var root = document.createElement("div");
    root.id = "verbi-root";
    el.appendChild(root);
    var cfg = { server: server, site: site, pageKey: pageKey, pageTitle: pageTitle };
    if (typeof tailwind !== "undefined") render(root, cfg);
  }

  function render(root, cfg) {
    root.innerHTML = [
      '<div class="max-w-[700px] mx-auto p-5" style="font-family:-apple-system,BlinkMacSystemFont,\\"Segoe UI\\",Roboto,sans-serif;color:#171717">',
      '<div class="flex items-center justify-between pb-3 mb-4" style="border-bottom:1px solid #d4d4d4">',
      '<h3 class="m-0 text-base font-semibold">Comments</h3>',
      '</div>',
      '<form id="ma-form" class="mb-4">',
      '<textarea id="ma-content" placeholder="Write a comment... (Markdown supported)" rows="4" class="w-full min-h-[90px] p-2.5 border rounded-md text-sm resize-y outline-none box-border" style="border-color:#d4d4d4;font-family:inherit;background:#ffffff;color:#171717"></textarea>',
      '<div class="flex gap-1.5 mt-1.5">',
      '<input id="ma-name" placeholder="Name *" class="flex-1 p-2 border rounded-md text-sm outline-none" style="border-color:#d4d4d4;background:#ffffff;color:#171717" />',
      '<input id="ma-email" type="email" placeholder="Email *" class="flex-1 p-2 border rounded-md text-sm outline-none" style="border-color:#d4d4d4;background:#ffffff;color:#171717" />',
      '</div>',
      '<button type="submit" class="mt-4 px-4 py-1.5 rounded-md text-sm font-medium border-none cursor-pointer" style="  background:#171717;color:#ffffff">Comment</button>',
      '</form>',
      '<div id="ma-list"><p class="text-center p-5" style="color:#a3a3a3;font-size:14px">Loading comments...</p></div>',
      '<p class="text-center mt-4 text-xs" style="color:#a3a3a3"><a href="https://github.com/your-repo/verbi" target="_blank" style="color:#525252;text-decoration:none">Verbi</a></p>',
      '</div>'
    ].join("\\n");

    var nameIn = root.querySelector("#ma-name");
    var emailIn = root.querySelector("#ma-email");
    var contentIn = root.querySelector("#ma-content");
    if (localStorage.getItem("ma_name")) nameIn.value = localStorage.getItem("ma_name");
    if (localStorage.getItem("ma_email")) emailIn.value = localStorage.getItem("ma_email");

    fetchComments(cfg, root);
    setupForm(cfg, root);
  }

  function fetchComments(cfg, root) {
    var list = root.querySelector("#ma-list");
    fetch(cfg.server + "/api/comments?pageKey=" + encodeURIComponent(cfg.pageKey) + "&site=" + encodeURIComponent(cfg.site))
      .then(function(r) { return r.json(); })
      .then(function(json) {
        var data = json.data || [];
        if (data.length === 0) {
          list.innerHTML = '<p class="text-center p-5" style="color:#a3a3a3;font-size:14px">No comments yet. Be the first!</p>';
          return;
        }
        list.innerHTML = "";
        data.forEach(function(c) { list.appendChild(renderComment(c, cfg, 0)); });
      })
      .catch(function() {
        list.innerHTML = '<p class="text-center p-5" style="color:#a3a3a3;font-size:14px">Failed to load comments.</p>';
      });
  }

  function renderComment(c, cfg, depth) {
    var el = document.createElement("div");
    el.className = "py-3.5" + (depth > 0 ? " ml-5 pl-4" : "") + (depth > 0 ? "" : "") + " comment-item";
    if (depth > 0) el.style.borderLeft = "2px solid #d4d4d4";
    el.style.borderBottom = "1px solid #d4d4d4";
    var score = (c.votes || []).reduce(function(s, v) { return s + v.value; }, 0);
    el.innerHTML = [
      c.isPinned ? '<span class="text-xs" style="color:#525252">📌 Pinned</span>' : "",
      '<div class="flex items-center gap-1.5 mb-1">',
      '<span class="w-[26px] h-[26px] rounded-full inline-flex items-center justify-center text-xs font-semibold" style="background:#f5f5f5;color:#525252">' + initials(c.user.name) + '</span>',
      '<span class="text-sm font-medium">' + esc(c.user.name) + '</span>',
      '<span class="text-xs" style="color:#a3a3a3">' + timeAgo(c.createdAt) + '</span>',
      '</div>',
      '<div class="text-sm leading-relaxed my-1 ma-body">' + md(c.content) + '</div>',
      '<div class="flex items-center gap-2.5 text-xs" style="color:#525252">',
      '<button class="ma-vote bg-none border-none cursor-pointer" data-id="' + c.id + '" data-v="1" style="color:inherit;padding:2px 4px">▲</button>',
      score !== 0 ? '<span class="text-xs" style="color:#525252">' + score + '</span>' : "",
      '<button class="ma-vote bg-none border-none cursor-pointer" data-id="' + c.id + '" data-v="-1" style="color:inherit;padding:2px 4px">▼</button>',
      '<button class="ma-reply-btn bg-none border-none cursor-pointer" data-id="' + c.id + '" style="color:inherit;padding:2px 4px">↩ Reply</button>',
      '</div>',
      '<div class="ma-reply-form" id="ma-reply-' + c.id + '"></div>',
    ].join("\\n");
    if (c.replies) {
      c.replies.forEach(function(r) { el.appendChild(renderComment(r, cfg, depth + 1)); });
    }
    el.querySelectorAll(".ma-vote").forEach(function(btn) {
      btn.addEventListener("click", function(e) {
        var target = e.currentTarget;
        vote(target.dataset.id, parseInt(target.dataset.v), cfg);
      });
    });
    el.querySelectorAll(".ma-reply-btn").forEach(function(btn) {
      btn.addEventListener("click", function(e) {
        var id = e.currentTarget.dataset.id;
        var form = el.querySelector("#ma-reply-" + id);
        if (form.innerHTML === "") {
          form.innerHTML = renderReplyForm(cfg, id);
          form.querySelector(".ma-reply-form-inner").addEventListener("submit", function(ev) {
            ev.preventDefault();
            submitReply(ev.target, cfg);
          });
        } else {
          form.innerHTML = "";
        }
      });
    });
    return el;
  }

  function renderReplyForm(cfg, parentId) {
    return [
      '<form class="ma-reply-form-inner mt-3">',
      '<textarea class="w-full min-h-[70px] p-2 border rounded-md text-sm resize-y outline-none box-border" placeholder="Write a reply..." rows="3" style="border-color:#d4d4d4;font-family:inherit;background:#ffffff;color:#171717"></textarea>',
      '<div class="flex gap-1.5 mt-1.5">',
      '<input class="flex-1 p-2 border rounded-md text-sm outline-none" placeholder="Name *" style="border-color:#d4d4d4;background:#ffffff;color:#171717" />',
      '<input class="flex-1 p-2 border rounded-md text-sm outline-none" placeholder="Email *" style="border-color:#d4d4d4;background:#ffffff;color:#171717" />',
      '</div>',
      '<button type="submit" class="mt-2 px-3 py-1 rounded-md text-xs font-medium border-none cursor-pointer" style="  background:#171717;color:#ffffff">Reply</button>',
      '</form>'
    ].join("\\n");
  }

  function submitReply(form, cfg) {
    var content = form.querySelector("textarea").value;
    var name = form.querySelectorAll("input")[0].value || localStorage.getItem("ma_name") || "";
    var email = form.querySelectorAll("input")[1].value || localStorage.getItem("ma_email") || "";
    var parentId = form.closest(".ma-reply-form").id.replace("ma-reply-", "");
    if (!content || !name || !email) return;
    localStorage.setItem("ma_name", name);
    localStorage.setItem("ma_email", email);
    fetch(cfg.server + "/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content, pageKey: cfg.pageKey, pageTitle: cfg.pageTitle, site: cfg.site, name: name, email: email, parentId: parentId })
    }).then(function(r) {
      if (r.ok) window.location.reload();
    });
  }

  function setupForm(cfg, root) {
    root.querySelector("#ma-form").addEventListener("submit", function(e) {
      e.preventDefault();
      var content = root.querySelector("#ma-content").value;
      var name = root.querySelector("#ma-name").value;
      var email = root.querySelector("#ma-email").value;
      if (!content || !name || !email) return;
      localStorage.setItem("ma_name", name);
      localStorage.setItem("ma_email", email);
      fetch(cfg.server + "/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content, pageKey: cfg.pageKey, pageTitle: cfg.pageTitle, site: cfg.site, name: name, email: email })
      }).then(function(r) {
        if (r.ok) { root.querySelector("#ma-content").value = ""; fetchComments(cfg, root); }
      });
    });
  }

  function vote(commentId, value, cfg) {
    var email = localStorage.getItem("ma_email");
    if (!email) { alert("Please comment first to set your identity."); return; }
    fetch(cfg.server + "/api/comments/" + commentId + "/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: value, email: email })
    }).then(function(r) { if (r.ok) window.location.reload(); });
  }

  function md(text) {
    text = text.replace(/^(#{1,6})(\\S)/gm, "$1 $2");
    var lines = text.split("\\n");
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var m = line.match(/^(#{1,6})\\s+(.+)$/);
      if (m) {
        var level = m[1].length;
        out.push("<h" + level + ">" + esc(m[2]) + "</h" + level + ">");
      } else {
        if (out.length > 0 && out[out.length-1].indexOf("<p>") !== 0) out.push("<p>" + esc(line) + "</p>");
        else if (line.trim()) out.push("<p>" + esc(line) + "</p>");
      }
    }
    return out.join("\\n").replace(/\\*\\*(.+?)\\*\\*/g, "<strong>$1</strong>").replace(/\\*(.+?)\\*/g, "<em>$1</em>");
  }
  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function initials(n) { return n.slice(0,2).toUpperCase(); }
  function timeAgo(d) { var diff = Date.now() - new Date(d).getTime(); var m = Math.floor(diff/60000); if(m<1) return "just now"; if(m<60) return m+"m ago"; var h=Math.floor(m/60); if(h<24) return h+"h ago"; var dd=Math.floor(h/24); if(dd<30) return dd+"d ago"; return new Date(d).toLocaleDateString(); }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
`;

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
