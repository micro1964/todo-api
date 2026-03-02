import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User.mjs";
import { registerSchema, loginSchema } from "../validators/authValidator.mjs";

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register user
 */
router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const hashed = await bcrypt.hash(req.body.password, 10);
  const user = await User.create({ email: req.body.email, password: hashed });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
  const link = `https://YOUR_API/api/auth/verify/${token}`;

  await transporter.sendMail({
    to: user.email,
    subject: "Verify account",
    html: `<a href="${link}">Verify Email</a>`
  });

  res.json({ message: "Check email to verify account" });
});

router.get("/verify/:token", async (req, res) => {
  const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
  await User.findByIdAndUpdate(decoded.id, { isVerified: true });
  res.send("Email verified");
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const user = await User.findOne({ email: req.body.email });
  if (!user || !user.isVerified) return res.status(403).json({ message: "Verify email first" });

  const match = await bcrypt.compare(req.body.password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

  user.refreshToken = refreshToken;
  await user.save();

  res.json({ accessToken, refreshToken });
});

router.post("/refresh", async (req, res) => {
  const decoded = jwt.verify(req.body.refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id);

  if (!user || user.refreshToken !== req.body.refreshToken) return res.sendStatus(403);

  const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
  res.json({ accessToken: newAccessToken });
});

router.post("/logout", async (req, res) => {
  await User.findOneAndUpdate({ refreshToken: req.body.refreshToken }, { refreshToken: "" });
  res.json({ message: "Logged out" });
});

export default router;
