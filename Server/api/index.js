import serverless from "serverless-http";
import app from "../app.js";

// Wrap Express with serverless-http
const handler = serverless(app);

// Export the handler for Vercel
export default async (req, res) => {
    return await handler(req, res);
};
