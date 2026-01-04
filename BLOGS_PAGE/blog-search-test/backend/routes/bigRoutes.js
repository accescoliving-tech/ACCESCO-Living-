import express from "express";
import { supabase } from "../SupabaseClient.js";

const router = express.Router();

/* =========================
   GET all blogs
========================= */
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   POST a new blog
========================= */
router.post("/", async (req, res) => {
  try {
    const { title, content, author } = req.body;

    const { data, error } = await supabase
      .from("blogs")
      .insert([{ title, content, author }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
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
