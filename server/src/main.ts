import express from "express";
import dotenv from "dotenv";
import privateRoute from "./routes/privateRoutes";

dotenv.config();
const app = express();
app.use(express.json());

// Use your private routes
app.use("/api", privateRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
