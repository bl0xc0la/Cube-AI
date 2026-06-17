import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const OPENROUTER_KEY = process.env.OPENROUTER_KEY;

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>CubeAI</title>

<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

<style>
body {
    margin: 0;
    background: #0d1117;
    color: #e6edf3;
    font-family: system-ui, sans-serif;
}

#app {
    max-width: 800px;
    margin: auto;
    height: 100vh;
    display: flex;
    flex-direction: column;
}

#chat {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
}

.msg {
    margin-bottom: 16px;
    padding: 12px 14px;
    border-radius: 10px;
    line-height: 1.5;
}

.user {
    background: #21262d;
    align-self: flex-end;
}

.ai {
    background: transparent;
}

#inputBar {
    display: flex;
    padding: 12px;
    border-top: 1px solid #30363d;
}

textarea {
    flex: 1;
    resize: none;
    background: #161b22;
    border: none;
    color: white;
    padding: 10px;
    border-radius: 8px;
    outline: none;
}

button {
    margin-left: 10px;
    padding: 10px 14px;
    background: #238636;
    border: none;
    color: white;
    border-radius: 8px;
    cursor: pointer;
}

/* ChatGPT-like code block */
.code-wrapper {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 10px;
    margin: 10px 0;
    overflow: hidden;
}

.code-header {
    display: flex;
    justify-content: space-between;
    padding: 6px 10px;
    font-size: 12px;
    background: #0d1117;
    border-bottom: 1px solid #30363d;
}

.copy-btn {
    background: none;
    border: 1px solid #444;
    color: white;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 6px;
    cursor: pointer;
}

pre {
    margin: 0;
    padding: 12px;
    overflow-x: auto;
}
code {
    color: #7ee787;
}
</style>
</head>

<body>
<div id="app">
    <div id="chat"></div>

    <div id="inputBar">
        <textarea id="input" placeholder="Message..."></textarea>
        <button onclick="send()">Send</button>
    </div>
</div>

<script>
const chat = document.getElementById("chat");
const input = document.getElementById("input");

/* Markdown safe renderer */
const renderer = new marked.Renderer();

renderer.code = (code, lang) => {
    const id = "code_" + Math.random().toString(36).slice(2);

    return `
    <div class="code-wrapper">
        <div class="code-header">
            <span>${lang || "code"}</span>
            <button class="copy-btn" onclick="copyCode('${id}')">Copy</button>
        </div>
        <pre><code id="${id}">${escapeHtml(code)}</code></pre>
    </div>`;
};

marked.setOptions({ renderer, breaks: true });

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function copyCode(id) {
    const el = document.getElementById(id);
    if (!el) return;
    navigator.clipboard.writeText(el.innerText);
}

/* Add message */
function addMsg(text, type) {
    const div = document.createElement("div");
    div.className = "msg " + type;

    div.innerHTML = type === "ai"
        ? marked.parse(String(text || ""))
        : escapeHtml(text);

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    return div;
}

/* STREAM FIX (NO OBJECT BUGS) */
async function send() {
    const msg = input.value.trim();
    if (!msg) return;

    input.value = "";

    addMsg(msg, "user");

    const box = addMsg("Thinking...", "ai");

    let full = "";

    const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg })
    });

    if (!res.ok || !res.body) {
        box.innerHTML = "Server error.";
        return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // 🔥 CRITICAL FIX: force string only
        if (typeof chunk === "string") {
            full += chunk;
        }

        // prevent object pollution
        if (typeof full !== "string") full = String(full);

        box.innerHTML = marked.parse(full);
        chat.scrollTop = chat.scrollHeight;
    }
}

input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
    }
});
</script>

</body>
</html>

  `);
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.2-3b-instruct",
        messages: [{ role: "user", content: userMessage }]
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("CubeAI backend running");
});
