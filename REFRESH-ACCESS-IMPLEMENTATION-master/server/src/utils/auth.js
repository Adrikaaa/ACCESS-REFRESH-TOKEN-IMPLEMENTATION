import jwt from "jsonwebtoken";
import config from "../config/config.js";

export const generateTokens = ({ userId }) => {
  if (!config.ACCESS_TOKEN_SECRET || !config.REFRESH_TOKEN_SECRET) {
    throw new Error("Token secrets are not configured");
  }

  const accessToken = jwt.sign({ id: userId }, config.ACCESS_TOKEN_SECRET, {
    expiresIn: "20m",
  });
  const refreshToken = jwt.sign({ id: userId }, config.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

export function verifyAccessToken(token) {
  if (!config.ACCESS_TOKEN_SECRET) {
    const error = new Error("ACCESS_TOKEN_SECRET is not configured");
    error.code = "AUTH_CONFIG_ERROR";
    throw error;
  }

  if (typeof token !== "string" || token.length === 0) {
    const error = new Error("Access token is missing");
    error.name = "JsonWebTokenError";
    throw error;
  }

  return jwt.verify(token, config.ACCESS_TOKEN_SECRET);
}

export function verifyRefreshToken(token) {
  const decoded = jwt.verify(token, config.REFRESH_TOKEN_SECRET);
  return decoded;
}
