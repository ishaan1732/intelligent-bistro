import express from "express";
import cors from "cors";
import menuRouter from "./routes/menu";
import chatRouter from "./routes/chat";
import 'dotenv/config'

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/menu", menuRouter);
app.use("/chat", chatRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
