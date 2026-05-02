import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import { clerk } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import router from "./routes/index.js";

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use(clerk);

app.use("/api", router);

app.use(errorHandler);

export default app;
