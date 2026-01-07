const API_URL = "http://localhost:5000/api/blogs";

/* ================= IMAGE PREVIEW ================= */
const imageInput = document.getElementById("image");
const previewBox = document.getElementById("imagePreview");
const previewImg = document.getElementById("previewImg");

if (imageInput) {
  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;
    previewImg.src = URL.createObjectURL(file);
    previewBox.classList.remove("hidden");
  });
}

function removeImage() {
  imageInput.value = "";
  previewImg.src = "";
  previewBox.classList.add("hidden");
}

/* ================= LOAD FEED ================= */
async function loadFeed() {
  const res = await fetch(API_URL);
  const blogs = await res.json();

  renderFeed(blogs);
  renderSide(blogs);
  loadPopular();
}

/* ================= RENDER FEED ================= */
function renderFeed(blogs) {
  const container = document.getElementById("results");
  container.innerHTML = blogs.map(b => `
    <div class="blog-card">

      ${b.image_url ? `<img src="${b.image_url}" class="blog-image" />` : ""}

      <h3>${b.title}</h3>
      <p>${b.content}</p>

      <div class="blog-actions">
        <button onclick="likeBlog('${b.id}')">
          ❤️ ${b.likes || 0}
        </button>

        <span class="comment-indicator" onclick="focusComment('${b.id}')">
          💬 Comments
        </span>

        <button onclick="shareBlog('${b.id}')">
          🔗 Share
        </button>

        <button class="danger" onclick="deleteBlog('${b.id}')">
          🗑️ Delete
        </button>
      </div>

      <div class="comments">
        <div class="comment-list" id="comment-list-${b.id}">
          <p class="muted">Loading comments...</p>
        </div>

        <div class="comment-box">
          <input id="comment-input-${b.id}" placeholder="Write a comment..." />
          <button onclick="postComment('${b.id}')">Post</button>
        </div>
      </div>

    </div>
  `).join("");

  blogs.forEach(b => loadComments(b.id));
}

/* ================= SIDEBARS ================= */
function renderSide(blogs) {
  document.getElementById("recent").innerHTML =
    blogs.slice(0, 4).map(b => `<div>${b.title}</div>`).join("");
}

async function loadPopular() {
  const res = await fetch(`${API_URL}/popular`);
  const blogs = await res.json();
  document.getElementById("popular").innerHTML =
    blogs.map(b => `<div>❤️ ${b.likes || 0} — ${b.title}</div>`).join("");
}

/* ================= BLOG ACTIONS ================= */
async function likeBlog(blogId) {
  const res = await fetch(
    `http://localhost:5000/api/blogs/${blogId}/like`,
    { method: "POST" }
  );

  if (!res.ok) {
    alert("Like failed");
    return;
  }

  loadFeed();
}

async function deleteBlog(blogId) {
  const ok = confirm("Delete this blog? This cannot be undone.");
  if (!ok) return;

  const res = await fetch(`${API_URL}/${blogId}`, { method: "DELETE" });

  if (!res.ok) {
    let msg = "Delete failed";
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      // ignore
    }
    alert(msg);
    return;
  }

  loadFeed();
}


function shareBlog(id) {
  const url = `${window.location.origin}/#blog-${id}`;
  navigator.clipboard.writeText(url);
  alert("Blog link copied!");
}

function focusComment(blogId) {
  document.getElementById(`comment-input-${blogId}`)?.focus();
}

/* ================= COMMENTS ================= */
async function loadComments(blogId) {
  const res = await fetch(`${API_URL}/${blogId}/comments`);
  const comments = await res.json();

  const box = document.getElementById(`comment-list-${blogId}`);
  if (!box) return;

  if (!comments.length) {
    box.innerHTML = `<p class="muted">No comments yet</p>`;
    return;
  }

  box.innerHTML = comments.map(c => `
    <div class="comment">
      <div>${c.text}</div>

      <div class="comment-actions">
        <button onclick="likeComment('${c.id}')">
          ❤️ ${c.likes || 0}
        </button>

        <button onclick="toggleReply('${c.id}')">
          Reply
        </button>
      </div>


      <div id="reply-${c.id}" class="reply-box hidden">
        <input id="reply-input-${c.id}" placeholder="Write a reply..." />
        <button onclick="postReply('${c.id}')">Reply</button>
      </div>

    </div>
  `).join("");
}

async function postComment(blogId) {
  const input = document.getElementById(`comment-input-${blogId}`);
  const text = input.value.trim();
  if (!text) return;

  await fetch(`${API_URL}/${blogId}/comment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  input.value = "";
  loadComments(blogId);
}

function toggleReply(commentId) {
  document.getElementById(`reply-${commentId}`)?.classList.toggle("hidden");
}

async function postReply(commentId) {
  const input = document.getElementById(`reply-input-${commentId}`);
  const text = input.value.trim();
  if (!text) return;

  await fetch(`${API_URL}/comments/${commentId}/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  loadFeed();
}

/* ================= CREATE BLOG ================= */
async function addBlog() {
  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  const tags = document.getElementById("tags").value
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);

  if (!title || !content) return alert("Title & content required");

  let image_url = null;
  const file = imageInput.files[0];

  if (file) {
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch(`${API_URL}/upload`, { method: "POST", body: fd });
    const data = await res.json();
    image_url = data.url;
  }

  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content, tags, image_url })
  });

  removeImage();
  loadFeed();
}

/* ================= SEARCH ================= */
async function searchBlogs() {
  const q = search.value.trim();
  if (!q) return loadFeed();
  const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}`);
  renderFeed(await res.json());
}

async function likeComment(commentId) {
  const res = await fetch(
    `${API_URL}/comments/${commentId}/like`,
    { method: "POST" }
  );

  if (!res.ok) {
    console.error("Failed to like comment");
    return;
  }

  loadFeed(); // refresh comments & counts
}

function toggleReply(commentId) {
  const box = document.getElementById(`reply-${commentId}`);
  if (box) box.classList.toggle("hidden");
}

async function postReply(commentId) {
  const input = document.getElementById(`reply-input-${commentId}`);
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  await fetch(`${API_URL}/comments/${commentId}/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  input.value = "";
  loadFeed();
}

/* ================= INIT ================= */
loadFeed();