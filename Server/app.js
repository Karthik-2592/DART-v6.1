import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import modular routes
import userRoutes from "./routes/userRoutes.js";
import songRoutes from "./routes/songRoutes.js";
import contributorRoutes from "./routes/contributorRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import playlistRoutes from "./routes/playlistRoutes.js";
import followRoutes from "./routes/followRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
    res.send("Server is running!");
});
// Prefix all routes with /api as requested
// This makes sure the endpoints are available at /api/users, /api/songs, etc.
app.use("/api/users", userRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/contributors", contributorRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/users", followRoutes);
app.use("/api/comments", commentRoutes);

// Base Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});

export default app;