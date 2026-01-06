import express from "express";
import cors from "cors";
import bigRoutes from "./routes/bigRoutes.js";
import path from "path";
import { fileURLToPath } from "url";


const app = express();

/* PATH SETUP */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, "../frontend");

/* MIDDLEWARE */
app.use(cors());
app.use(express.json());

/* FRONTEND (STATIC) */
app.use(express.static(frontendPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

/* BLOG API (Supabase-backed) */
app.use("/api/blogs", bigRoutes);

/* SERVER */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
