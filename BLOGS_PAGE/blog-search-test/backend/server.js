import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bigRoutes from "./routes/bigRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, "../frontend");

/* MIDDLEWARE */
app.use(cors());
app.use(express.json());

/* DB CONNECTION */
mongoose.connect("mongodb://127.0.0.1:27017/blogTest")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

/* ROOT TEST ROUTE */
app.use(express.static(frontendPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

/* BLOG API */
app.use("/api/blogs", bigRoutes);

/* SEARCH BLOG */

/* SERVER */
app.listen(5000, () => {
  console.log("Backend running on port 5000");
});
