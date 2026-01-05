const API_BASE = window.location.port === "5173" ? "http://localhost:5000" : window.location.origin;
const API_URL = `${API_BASE}/api/blogs`;

const apiBaseEl = document.getElementById("apiBase");
if (apiBaseEl) apiBaseEl.textContent = API_BASE;

function getToastStack() {
  const el = document.getElementById("toastStack");
  return el;
}

function showToast(message, type = "info") {
  const stack = getToastStack();
  if (!stack) {
    alert(message);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="dot"></span>
    <span>${message}</span>
    <button aria-label="Dismiss" onclick="this.parentElement.remove()">✕</button>
  `;

  stack.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4200);
}

// Add blog
async function addBlog() {
  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  const tags = document
    .getElementById("tags")
    .value
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);

  if (!title || !content) {
    showToast("Title and content are required to add a blog.", "error");
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, tags })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }

    const data = await res.json();
    showToast("Blog added successfully!", "success");
    document.getElementById("title").value = "";
    document.getElementById("content").value = "";
    document.getElementById("tags").value = "";
    console.log(data);
  } catch (err) {
    showToast(`Failed to add blog: ${err.message || err}`, "error");
  }
}

// Search blogs
async function searchBlogs() {
  const query = document.getElementById("search").value.trim();
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  try {
    const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }

    const blogs = await res.json();

    if (!blogs.length) {
      resultsDiv.innerHTML = '<div class="empty-state">No posts found. Try another keyword or tag.</div>';
      return;
    }

    blogs.forEach(blog => {
      const div = document.createElement("div");
      div.className = "blog fade-in";
      const tags = (blog.tags || []).map(tag => `<span class="pill">${tag}</span>`).join("");
      div.innerHTML = `
        <div class="blog-meta">Found match · ${(blog.tags || []).length || 0} tag${(blog.tags || []).length === 1 ? "" : "s"}</div>
        <h3>${blog.title}</h3>
        <p>${blog.content}</p>
        <div class="blog-tags">${tags}</div>
      `;
      resultsDiv.appendChild(div);
    });

    if (!query) {
      showToast("Showing latest blogs.", "success");
    } else {
      showToast(`Showing results for "${query}"`, "success");
    }
  } catch (err) {
    showToast(`Search failed: ${err.message || err}`, "error");
  }
}
