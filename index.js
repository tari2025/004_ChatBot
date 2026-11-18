const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect("/index.html");
});

app.post("/api/chat", async (req, res) => {
    try {
        const message = req.body.message;

        if (!message || !Array.isArray(message)) {
            return res.status(400).json({
                error: "message harus berupa array"
            });
        }

        const response = await fetch("https://api.openrouter.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
            },
            body: JSON.stringify({
                model: "nvidia/nemotron-3.5-super-v1:free",
                messages: message,
                temperature: 0.7,
                max_tokens: 1000,
                stream: true
            })
        });

        if (!response.ok) {
            const errorData = await response.text();

            console.error("OpenRouter Error:", errorData);
            return res.status(response.status).json({ error: errorData });
        }

        // header untuk streaming
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = "";

        