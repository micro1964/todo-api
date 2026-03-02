import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.mjs";
import authRoutes from "./routes/auth.mjs";
import todoRoutes from "./routes/todos.mjs";
import { limiter } from "./middleware/rateLimiter.mjs";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger.mjs";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(limiter);

app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(3000);
