import { Request, Response } from "express";
import pool from "../utils/db";
import axios from "axios";
import dotenv from "dotenv";
import { sendEmail } from "../utils/emailHelper";

dotenv.config();

const GEMINI_API_URL = process.env.GEMINI_API_URL!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

export const setUpcomingFestivals = async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(today.getDate() + 14);
    const twoWeeksLaterStr = twoWeeksLater.toISOString().split("T")[0];

    const festivalResult = await pool.query(
      `SELECT name, date FROM festivals 
       WHERE date BETWEEN $1 AND $2
       ORDER BY date ASC`,
      [todayStr, twoWeeksLaterStr]
    );

    const festivals = festivalResult.rows;

    if (festivals.length === 0) {
      return res.status(404).json({
        message: "No festivals found in the next 14 days.",
      });
    }

    await Promise.all(
      festivals.map((festival) =>
        pool.query(
          `INSERT INTO scheduled_dates (festival, dates, id, sent)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (festival, dates, id) DO NOTHING`,
          [festival.name, festival.date, userId, false]
        )
      )
    );

    await pool.query(
      `UPDATE user_subscription
       SET has_used_free = TRUE, free_expiry = $2
       WHERE id = $1`,
      [userId, twoWeeksLaterStr]
    );

    const userBusinessResult = await pool.query(
      `SELECT u.email, b.business_name, b.business_category
       FROM users u
       JOIN user_business b ON u.id = b.user_id
       WHERE u.id = $1`,
      [userId]
    );

    const userData = userBusinessResult.rows[0];

    if (!userData) {
      return res.status(404).json({ error: "User or business data not found" });
    }

    const promptText = `You are an expert social media content creator specialized in making engaging Instagram posts for local businesses.

Given the following inputs:
- Business Name: "${userData.business_name}"
- Business Category: "${userData.business_category}"
- Festival Name: "Diwali"

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
      llmResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedPostIdea) {
      throw new Error("Empty Gemini API response");
    }
    generatedPostIdea = generatedPostIdea.trim();

    console.log("Generated Post Idea:", generatedPostIdea);

    await sendEmail(userData.email, generatedPostIdea);

    res.status(200).json({
      status: "SUCCESS",
      message: "Posts are set for next 14 days.",
    });
  } catch (err) {
    console.error("Failed in setUpcomingFestivals:", err);
    res.status(500).json({
      error: "Failed to process festivals and generate example email",
    });
  }
};
