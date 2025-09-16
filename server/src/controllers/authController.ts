import { Request, Response } from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import pool from "../utils/db";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;

export const googleLogin = async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) return res.status(400).json({ error: "Token is required" });

  try {
    // Verify token with Google
    const response = await axios.get(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`
    );

    const { email, name, aud } = response.data;

    if (aud !== GOOGLE_CLIENT_ID) {
      return res.status(400).json({ error: "Invalid Google token" });
    }

    // Check if user exists
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const userResultValue = userResult.rows[0];
    const userId = userResultValue.id;
    const userBusiness = await pool.query(
      `SELECT * FROM user_business WHERE id = $1`,
      [userId]
    );
    const userSubscription = await pool.query(
      `SELECT * FROM user_subsription WHERE id = $1`,
      [userId]
    );

    let user = userResult.rows[0];
    let newUser: boolean = true;

    if (!user) {
      // Sign up new user
      const insertResult = await pool.query(
        "INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *",
        [email, name]
      );
      user = insertResult.rows[0];
    } else {
      // Optional: update updated_at
      await pool.query("UPDATE users SET updated_at = NOW() WHERE id = $1", [
        user.id,
      ]);
      newUser = false;
    }

    // Generate JWT
    const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      status: "SUCCESS",
      token: jwtToken,
      user,
      new_user: newUser,
      user_business: userBusiness.rows[0] ? userBusiness.rows[0] : null,
      user_subscription: userSubscription.rows[0]
        ? userSubscription.rows[0]
        : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Google authentication failed" });
  }
};
