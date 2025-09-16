import { Request, Response } from "express";
import pool from "../utils/db";
import axios from "axios";
import dotenv from "dotenv";
import { sendEmail } from "../utils/emailHelper";

dotenv.config();

const GEMINI_API_URL = process.env.GEMINI_API_URL!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

export const sendTodayFestivalEmails = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

    // 1️ Query scheduled_dates for today where sent = false
    const scheduledFestivalsResult = await pool.query(
      `SELECT sd.festival, sd.id AS user_id, u.email, b.business_name, b.business_category
       FROM scheduled_dates sd
       JOIN users u ON sd.id = u.id
       JOIN user_business b ON u.id = b.user_id
       WHERE sd.dates = $1 AND sd.sent = false`,
      [todayStr]
    );

    const scheduledFestivals = scheduledFestivalsResult.rows;

    if (scheduledFestivals.length === 0) {
      return res.json({ message: "No festivals scheduled for today." });
    }

    // 2️ Process each scheduled festival
    for (const fest of scheduledFestivals) {
      const promptText = `You are an expert social media content creator specialized in making engaging Instagram posts for local businesses.

Given the following inputs:
- Business Name: "${fest.business_name}"
- Business Category: "${fest.business_category}"
- Festival Name: "${fest.festival}"

Create a detailed Instagram post concept for the festival. The output should include:
1. A description of the image content (what should the picture look like?).
2. A catchy, friendly caption that mentions the business name and location.
3. A tone that is festive, warm, and inviting.`;

      const llmResponse = await axios.post(
        GEMINI_API_URL,
        {
          contents: [{ parts: [{ text: promptText }] }],
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": GEMINI_API_KEY,
          },
        }
      );

      let generatedPostIdea =
        llmResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      generatedPostIdea = generatedPostIdea.trim();

      console.log(
        `Generated Post Idea for user ${fest.user_id}:`,
        generatedPostIdea
      );

      // 3️ Send Email
      await sendEmail(fest.email, generatedPostIdea);

      // 4️ Mark as sent in DB
      await pool.query(
        `UPDATE scheduled_dates SET sent = true WHERE id = $1 AND dates = $2 AND festival = $3`,
        [fest.user_id, todayStr, fest.festival]
      );
    }

    res.json({
      message: `${scheduledFestivals.length} festival emails sent successfully.`,
    });
  } catch (err) {
    console.error("Failed to send today's festival emails:", err);
    res.status(500).json({
      error: "Failed to process and send today's festival emails",
    });
  }
};
