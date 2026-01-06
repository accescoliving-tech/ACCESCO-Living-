const API_BASE = window.location.port === "5173" ? "http://localhost:5000" : window.location.origin;
const API_URL = `${API_BASE}/api/blogs`;

const apiBaseEl = document.getElementById("apiBase");
if (apiBaseEl) apiBaseEl.textContent = API_BASE;

// Add blog
async function addBlog() {
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const tags = document
    .getElementById("tags")
    .value
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);

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
    alert("Blog added!");
    console.log(data);
  } catch (err) {
    alert(`Failed to add blog: ${err.message || err}`);
  }
}

// Search blogs
async function searchBlogs() {
  const query = document.getElementById("search").value;
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  try {
    const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }

    const blogs = await res.json();

    blogs.forEach(blog => {
      const div = document.createElement("div");
      div.className = "blog";
      div.innerHTML = `
        <h3>${blog.title}</h3>
        <p>${blog.content}</p>
        <small>${(blog.tags || []).join(", ")}</small>
      `;
      resultsDiv.appendChild(div);
    });
  } catch (err) {
    alert(`Search failed: ${err.message || err}`);
  }
}
