import { Router } from "express";
import { googleLogin } from "../controllers/authController";
import { setUpcomingFestivals } from "../controllers/setFestivalController";

const router = Router();

// POST /auth/google
router.post("/auth/google", googleLogin);

//upcoming festival
router.post("/festival/upcoming", setUpcomingFestivals);

export default router;
