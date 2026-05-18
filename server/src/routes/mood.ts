import 'dotenv/config';
import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

const menuPath = path.join(__dirname, '../data/menu.json');
const menu = JSON.parse(fs.readFileSync(menuPath, 'utf-8'));

const MoodRequestSchema = z.object({
  feeling: z.string().min(1),
});

router.post('/', async (req: Request, res: Response) => {
  console.log("MOOD ENDPOINT HIT, feeling:", req.body);

  const result = MoodRequestSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const { feeling } = result.data;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a mood interpreter for Intelligent Bistro restaurant app.

User input: "${feeling}"

Determine if this is a mood/feeling or a food order.
Map to exactly one of: joyful, comfort, stressed, heartbroken, adventurous, tired, romantic, neutral

If it is a food order or greeting, use mood: neutral

From this menu, pick 2-3 items whose moods array contains the detected mood:
${JSON.stringify(menu)}

Return ONLY this exact JSON with no markdown, no backticks, no extra text:
{"mood":"string","moodLabel":"string","openingMessage":"string","recommendedItemIds":["id1","id2"],"cartActions":[]}

openingMessage must be warm, empathetic, mention the recommended items by name.
cartActions: if user ordered food, fill with {type,itemId,name,price,qty} objects.
cartActions is empty array [] if no food ordered.`;

    const geminiResult = await model.generateContent(prompt);
    const text = geminiResult.response.text();
    console.log("GEMINI RAW RESPONSE:", text);

    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    res.json(parsed);
  } catch (error) {
    console.error("MOOD ERROR DETAIL:", error);
    return res.json({
      mood: 'neutral',
      moodLabel: 'Welcome',
      openingMessage: "Welcome to Intelligent Bistro! What would you like to order?",
      recommendedItemIds: [],
      cartActions: [],
    });
  }
});

export default router;
