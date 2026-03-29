import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import db from "./db.js";

// Import modular routes
import userRoutes from "./routes/userRoutes.js";
import songRoutes from "./routes/songRoutes.js";
import contributorRoutes from "./routes/contributorRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import playlistRoutes from "./routes/playlistRoutes.js";
import followRoutes from "./routes/followRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from storage directory
app.use("/Storage", express.static(path.join(__dirname, "Storage"), {
    setHeaders: (res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
    }
}));
app.use('/audio', express.static(path.join(__dirname, 'Storage/audio')));
app.use('/cover', express.static(path.join(__dirname, 'Storage/cover')));
app.use('/profilePic', express.static(path.join(__dirname, 'Storage/profilePic')));

// Register modular routes
app.use("/users", userRoutes);
app.use("/songs", songRoutes);
app.use("/contributors", contributorRoutes);
app.use("/favorites", favoriteRoutes);
app.use("/playlists", playlistRoutes);
app.use("/users", followRoutes); // Mount at /users since it covers /users/:username/follow
app.use("/comments", commentRoutes);

// Base Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
