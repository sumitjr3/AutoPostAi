import { sendEmail } from "../utils/emailHelper";
import { Request, Response } from "express";

export const sendFestivalEmail = async (req: Request, res: Response) => {
  try {
    const { toEmail, bodyContent } = req.body;

    if (!toEmail || !bodyContent) {
      return res
        .status(400)
        .json({ error: "toEmail and bodyContent required" });
    }

    await sendEmail(toEmail, bodyContent);

    res.json({ message: "Email sent successfully" });
  } catch (err) {
    console.error("Failed to send email:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
};
