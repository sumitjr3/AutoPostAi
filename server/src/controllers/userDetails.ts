import { Request, Response } from "express";
import pool from "../utils/db";

export const upsertUserDetails = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      business_name,
      business_category,
      business_city,
      business_state,
      business_country,
    } = req.body;

    if (
      !userId ||
      !business_name ||
      !business_category ||
      !business_city ||
      !business_state ||
      !business_country
    ) {
      return res
        .status(400)
        .json({ error: "All business details are required" });
    }

    const result = await pool.query(
      `INSERT INTO user_business (
        user_id,
        business_name,
        business_category,
        business_city,
        business_state,
        business_country
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        business_category = EXCLUDED.business_category,
        business_city = EXCLUDED.business_city,
        business_state = EXCLUDED.business_state,
        business_country = EXCLUDED.business_country,
        updated_at = NOW()
      RETURNING *`,
      [
        userId,
        business_name,
        business_category,
        business_city,
        business_state,
        business_country,
      ]
    );

    const user_subscription = await pool.query(
      `INSERT INTO user_subscription (
    user_id,
    has_used_free,
    payed,
    payment_date,
    payment_expiry
  ) VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
      [userId, false, false, null, null]
    );

    res.status(200).json({
      status: "SUCCESS",
      user_business: result.rows[0],
      user_subscription: user_subscription,
    });
  } catch (err) {
    console.error("Error setting user details:", err);
    res.status(500).json({ error: "Failed to set user details" });
  }
};
