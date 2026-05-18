import { Router, Request, Response } from "express";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import menu from "../data/menu.json";

const router = Router();

const ChatRequestSchema = z.object({
  message: z.string(),
  cart: z.array(z.unknown()),
  mood: z.string().optional(),
  recommendedItemIds: z.array(z.string()).optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional(),
});

router.post("/", async (req: Request, res: Response) => {
  const result = ChatRequestSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const { message, cart, mood, recommendedItemIds, history } = result.data;

  const historyText = history && history.length > 0
    ? 'Recent conversation:\n' +
      history.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n')
    : '';

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    console.log("KEY LOADED:", process.env.GEMINI_API_KEY?.slice(0, 8))
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `You are an AI ordering assistant for a restaurant called Intelligent Bistro.

Your job is to interpret the user's message and ALWAYS return a JSON object with exactly two fields:
- reply: a short friendly message to the user
- actions: an array of cart actions

RULES:
1. Always add items you CAN find on the menu immediately — do not ask for confirmation.
2. If an exact item isn't found, add the closest match from the menu.
3. Never return an empty actions array if any part of the request can be fulfilled.
4. For items you truly cannot match, mention it briefly in reply but still action everything else.
5. Always use the exact itemId, name, and price from the menu JSON below.
5. Always extract the exact quantity the user mentions. If user says "5 lemonade" 
   the qty must be 5, not 1.
6. If no quantity is mentioned, default to 1.
7. Never override the user's stated quantity with 1.

Also check the action type definition in the prompt and make sure qty is 
being passed as a number, not a string.

Do not change anything else in the file.

Action types allowed:
{ "type": "add", "itemId": "string", "name": "string", "price": number, "qty": number }
{ "type": "remove", "itemId": "string" }
{ "type": "update", "itemId": "string", "qty": number }
{ "type": "clear" }

MOOD CONTEXT (if provided):
User's current mood: ${mood || 'not specified'}

If mood is provided:
- Keep your tone consistent with the mood throughout
- If user asks for recommendations, prioritize items that match their mood
- Be empathetic and warm in your responses

Do not change anything else about how you process orders or return actions.

Current menu: ${JSON.stringify(menu)}
Current cart: ${JSON.stringify(cart)}

CRITICAL: Return ONLY a raw JSON object. No markdown, no backticks, no explanation text. Just the JSON.`;

    const response = await model.generateContent(`${systemPrompt}\n\n${historyText}\n\nUser message: ${message}`);
    const text = response.response.text();

    const parsed = JSON.parse(text);
    res.json({ reply: parsed.reply, actions: parsed.actions });
  } catch (error){
    console.error("CHAT ERROR:", error)
    res.json({ reply: "Sorry, I didn't understand that. Try again.", actions: [] });
  }
});

export default router;
