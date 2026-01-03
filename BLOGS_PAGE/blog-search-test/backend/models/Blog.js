import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    content: {
      type: String,
      required: true
    },
    tags: [String]
  },
  { timestamps: true }
);

// 🔍 Smart text search
blogSchema.index({
  title: "text",
  description: "text",
  content: "text",
  tags: "text"
});

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;