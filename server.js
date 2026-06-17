import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const OPENROUTER_KEY = process.env.OPENROUTER_KEY;

/* =========================
   🌐 FRONTEND UI
========================= */
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>CubeAI</title>

<style>
body {
  margin: 0;
  font-family: system-ui;
  background: #0d1117;
  color: white;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

#chat {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
}

#bar {
  display: flex;
  padding: 10px;
  border-top: 1px solid #333;
}

input {
  flex: 1;
  padding: 10px;
  border-radius: 6px;
  border: none;
}

button {
  margin-left: 10px;
  padding: 10px;
  border-radius: 6px;
  border: none;
  background: #238636;
  color: white;
  cursor: pointer;
}

.msg {
  margin: 8px 0;
  white-space: pre-wrap;
}

.user { color: #7ee787; }
.ai { color: #58a6ff; }
</style>
</head>

<body>

<div id="chat"></div>

<div id="bar">
  <input id="input" placeholder="Ask CubeAI..." />
  <button onclick="send()">Send</button>
</div>

<script>
const chat = document.getElementById("chat");

function add(text, cls){
  const div = document.createElement("div");
  div.className = "msg " + cls;
  div.innerText = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

async function send(){
  const input = document.getElementById("input");
  const msg = input.value.trim();
  if(!msg) return;

  add("You: " + msg, "user");
  input.value = "";

  add("CubeAI is thinking...", "ai");

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: msg })
  });

  const data = await res.json();

  add("AI: " + (data.reply || "No response"), "ai");
}
</script>

</body>
</html>
  `);
});

/* =========================
   🤖 CHAT API
========================= */
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://cubeai.app",
        "X-Title": "CubeAI"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.2-3b-instruct",
        messages: [
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await response.json();

    res.json({
      reply: data.choices?.[0]?.message?.content || "No response"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   🚀 START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("CubeAI backend running 🚀");
});
