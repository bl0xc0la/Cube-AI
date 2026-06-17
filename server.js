import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const OPENROUTER_KEY = process.env.OPENROUTER_KEY;

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<title>CubeAI</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
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
#chat { flex: 1; padding: 10px; overflow-y: auto; }
#bar { display: flex; padding: 10px; border-top: 1px solid #333; }
input { flex: 1; padding: 10px; }
button { padding: 10px; }
.msg { margin: 8px 0; }
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
}

async function send(){
  const input = document.getElementById("input");
  const msg = input.value;
  if(!msg) return;

  add("You: " + msg, "user");
  input.value = "";

  const res = await fetch("/chat", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({message: msg})
  });

  const data = await res.json();
  add("AI: " + data.reply, "ai");
}
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
