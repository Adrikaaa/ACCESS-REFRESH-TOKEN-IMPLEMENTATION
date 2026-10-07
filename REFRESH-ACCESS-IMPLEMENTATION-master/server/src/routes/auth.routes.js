import { Router } from "express";

import userModel from "../models/user.models.js";

import bcrypt from "bcryptjs";

import {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const isUserExists = await userModel.findOne({ email });

  if (isUserExists) {
    return res.status(400).json({
      message: "User already exists",
      errors: [
        {
          field: "email",
          message: "User already exists",
        },
      ],
    });
  }

  // Create user
  const user = await userModel.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens({
    userId: user._id,
  });

  // Save refresh token in DB
  user.refreshToken = refreshToken;
  await user.save();

  // Save refresh token in HTTP-only cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
  });

  // Send response
  return res.status(201).json({
    message: "User registered successfully",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    accessToken,
  });
});

/**
 * GET /api/auth/me
 * Fetches the currently authenticated user's profile details
 */
router.get("/me", async (req, res) => {
  console.log("Authorization header:", req.headers.authorization);

  const accessToken = req.headers.authorization?.split(" ")[1];

  console.log("Access token:", accessToken);

  if (!accessToken) {
    return res.status(401).json({
      message: "Access token is required",
    });
  }

  try {
    const decoded = verifyAccessToken(accessToken);

    console.log("Decoded token:", decoded);

    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User fetched successfully",
      data: {
        user: {
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    console.log("JWT ERROR:", error.message);

    return res.status(401).json({
      message: "Invalid or expired access token",
      error: error.message,
    });
  }
});

router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: "Unauthorized,refresh token not found",
    });
  }

  try {
    const decoded = await verifyRefreshToken(refreshToken);

    const user = await userModel.findById(decoded.id);
    if (refreshToken !== user.refreshToken) {
      user.refreshToken = null;
      await user.save();

      return res.status(401).json({
        message: "Unauthorized,refresh token mismatch",
      });
    }
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      userId: user._id,
    });
    res.cookie("refreshToken", newRefreshToken, { httpOnly: true });

    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      message: "token refreshed successfully",
      accessToken,
    });
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized,Invalid OR expired refresh token",
    });
  }
});
export default router;
