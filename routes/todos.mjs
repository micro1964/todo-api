import express from "express";
import Todo from "../models/Todo.mjs";
import { protect } from "../middleware/authMiddleware.mjs";

const router = express.Router();
router.use(protect);

router.get("/", async (req, res) => {
  const todos = await Todo.find({ user: req.user.id });
  res.json(todos);
});

router.post("/", async (req, res) => {
  const todo = await Todo.create({ user: req.user.id, title: req.body.title });
  res.json(todo);
});

router.put("/:id", async (req, res) => {
  const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(todo);
});

router.delete("/:id", async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

export default router;
