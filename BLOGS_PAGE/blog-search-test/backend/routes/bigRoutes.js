import express from "express";
import { supabase } from "../SupabaseClient.js";
import multer from "multer";

const TEMP_USER_ID = "11111111-1111-1111-1111-111111111111";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const router = express.Router();
/* =========================
   UPLOAD blog image
========================= */
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const file = req.file;
    const fileName = `blog-${Date.now()}-${file.originalname}`;

    const { error } = await supabase.storage
      .from("blog-images")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from("blog-images")
      .getPublicUrl(fileName);

    res.json({ url: data.publicUrl });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


/* =========================
   GET all blogs
========================= */
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("blogs")
      .select(`
        *,
        blog_likes(count)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const blogs = data.map(b => ({
      ...b,
      likes: b.blog_likes?.[0]?.count || 0
    }));

    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



/* =========================
   POST a new blog
========================= */
router.post("/", async (req, res) => {
  try {
    const { title, content, author,image_url } = req.body;

    const { data, error } = await supabase
      .from("blogs")
      .insert([{ title, content, author,image_url }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// LIKE BLOG (SAFE)
router.post("/:id/like", async (req, res) => {
  try {
    const blog_id = req.params.id;

    console.log("LIKE ATTEMPT:", {
      blog_id,
      user_id: TEMP_USER_ID
    });

    const { data: existing, error: selectError } = await supabase
      .from("blog_likes")
      .select("id")
      .eq("blog_id", blog_id)
      .eq("user_id", TEMP_USER_ID)
      .maybeSingle();

    if (selectError) {
      console.error("SELECT ERROR:", selectError);
      throw selectError;
    }

    if (existing) {
      await supabase
        .from("blog_likes")
        .delete()
        .eq("id", existing.id);

      return res.json({ liked: false });
    }

    const { error: insertError } = await supabase
      .from("blog_likes")
      .insert({
        blog_id,
        user_id: TEMP_USER_ID
      });

    if (insertError) {
      console.error("INSERT ERROR:", insertError);
      throw insertError;
    }

    res.json({ liked: true });

  } catch (err) {
    console.error("LIKE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// MOST LIKED
router.get("/popular", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("blogs")
      .select(`
        *,
        blog_likes ( count )
      `);

    if (error) throw error;

    const sorted = data
      .map(b => ({
        ...b,
        likes: b.blog_likes?.[0]?.count || 0
      }))
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 5);

    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD COMMENT
router.post("/:id/comment", async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Comment text required" });
    }

    const { data, error } = await supabase
      .from("comments")
      .insert([{ blog_id: id, text }])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET COMMENTS FOR A BLOG
router.get("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("comments")
      .select(`
        *,
        comment_likes ( count )
      `)
      .eq("blog_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const comments = data.map(c => ({
      ...c,
      likes: c.comment_likes?.[0]?.count || 0
    }));

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LIKE COMMENT
router.post("/comments/:id/like", async (req, res) => {
  try {
    const comment_id = req.params.id;

    const { data: existing } = await supabase
      .from("comment_likes")
      .select("id")
      .eq("comment_id", comment_id)
      .eq("user_id", TEMP_USER_ID)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("comment_likes")
        .delete()
        .eq("id", existing.id);

      return res.json({ liked: false });
    }

    await supabase.from("comment_likes").insert({
      comment_id,
      user_id: TEMP_USER_ID
    });

    res.json({ liked: true });
  } catch (err) {
    console.error("COMMENT LIKE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ADD REPLY
router.post("/comments/:id/reply", async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Reply text required" });
    }

    const { data, error } = await supabase
      .from("comments")
      .insert([
        {
          text,
          parent_id: id
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   SEARCH blogs
========================= */
router.get("/search", async (req, res) => {
  try {
    const q =
      typeof req.query.q === "string" ? req.query.q.trim() : "";

    if (!q) {
      return res.status(400).json({
        error: "Query param 'q' is required",
      });
    }

    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .or(
        `title.ilike.%${q}%,content.ilike.%${q}%`
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
