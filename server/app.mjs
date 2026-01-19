
// app.mjs
import express from "express";
import pg from "pg";                 // ✅ CommonJS interop
const { Pool } = pg;

const app = express();
const port = process.env.PORT || 4001;

// ✅ Parse JSON body
app.use(express.json());

// ✅ Create Pool (adjust your credentials)
const connectionPool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:1234@localhost:5432/assignment_db",
});

// Health check
app.get("/test", (_req, res) => {
  return res.json("Server API is working 🚀");
});

// ✅ Correct route syntax + async + placeholders
app.post("/assignments", async (req, res) => {
  try {
    const newAssignment = {
      ...req.body, // requires app.use(express.json())
      created_at: new Date(),
      updated_at: new Date(),
      published_at: new Date(),
    };

    // Basic validation
    if (!newAssignment.title || !newAssignment.content) {
      return res.status(400).json({
        message: "Validation failed",
        errors: {
          title: !newAssignment.title ? "title is required" : undefined,
          content: !newAssignment.content ? "content is required" : undefined,
        },
      });
    }

    // ⚠️ If your column is named length in Postgres, quote it as "length"
    const sql = `
      INSERT INTO assignments
        (user_id, title, content, category, "length", created_at, updated_at, published_at, status)
      VALUES
        ($1,      $2,    $3,     $4,       $5,       $6,        $7,        $8,          $9)
      RETURNING id, user_id, title, content, category, "length",
                created_at, updated_at, published_at, status
    `;

    const params = [
      1, // TODO: replace with real user_id from auth/session
      newAssignment.title,
      newAssignment.content,
      newAssignment.category ?? null,
      newAssignment.length ?? null,
      newAssignment.created_at,
      newAssignment.updated_at,
      newAssignment.published_at,
      newAssignment.status ?? "draft",
    ];

    const result = await connectionPool.query(sql, params);

    return res.status(201).json({
      message: "Assignment created successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("POST /assignments error:", err);
    return res.status(500).json({
      message:
        "Server could not create assignment because of a database or server error.",
      error: process.env.NODE_ENV === "development" ? String(err) : undefined,
    });
  }
});

app.listen(port, () => {
  console.log(`Panuwat Server is Running on Port ${port}`);
});
