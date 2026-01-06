const API_URL = "http://localhost:5000/api/blogs";

async function loadFeed() {
  const res = await fetch(API_URL);
  const blogs = await res.json();

  renderFeed(blogs);
  renderSide(blogs);
}

function renderFeed(blogs) {
  document.getElementById("results").innerHTML =
    blogs.map(b => `
      <div class="blog-card">
        <div class="blog-meta">
          ${new Date(b.created_at).toDateString()}
        </div>
        <h3>${b.title}</h3>
        <p>${b.content}</p>
      </div>
    `).join("");
}

function renderSide(blogs) {
  document.getElementById("recent").innerHTML =
    blogs.slice(0, 4).map(b => `<div>${b.title}</div>`).join("");

  document.getElementById("popular").innerHTML =
    blogs.slice(0, 4).map(b => `<div>${b.title}</div>`).join("");
}

async function addBlog() {
  const title = title.value;
  const content = content.value;
  const tags = tags.value.split(",").map(t => t.trim());

  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content, tags })
  });

  loadFeed();
}

async function searchBlogs() {
  const q = search.value;
  const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}`);
  const blogs = await res.json();
  renderFeed(blogs);
}

loadFeed();
