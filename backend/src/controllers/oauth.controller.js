import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import logger from "../config/logger.js";

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const buildUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  bio: user.bio,
  interests: user.interests,
  socialLinks: user.socialLinks,
  authProvider: user.authProvider,
});

// =========================================================
// 1. GOOGLE OAuth
// =========================================================
export const googleAuth = async (req, res) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Google authorization code is required" });
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      logger.error({ error: tokenData.error }, "Google token exchange failed");
      return res.status(401).json({ message: "Google authentication failed: " + tokenData.error_description });
    }

    // Verify the id_token
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${tokenData.id_token}`
    );

    if (!verifyRes.ok) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const googleUser = await verifyRes.json();
    const { sub: googleId, email, name, picture } = googleUser;

    if (!email) {
      return res.status(400).json({ message: "Could not get email from Google" });
    }

    // Check if user exists by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    if (user) {
      // Link Google account if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = user.authProvider === "local" ? "local" : "google";
        if (!user.avatar && picture) user.avatar = picture;
        await user.save({ validateBeforeSave: false });
      }
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        googleId,
        authProvider: "google",
        avatar: picture || "",
        role: "student", // Default role for OAuth users
      });
    }

    const token = generateToken(user);

    logger.info({ userId: user._id, provider: "google" }, "OAuth login");

    res.json({
      message: "Login successful",
      token,
      user: buildUserResponse(user),
    });
  } catch (error) {
    logger.error({ err: error }, "Google OAuth failed");
    res.status(500).json({ message: "Google authentication failed" });
  }
};

// =========================================================
// 2. GITHUB OAuth
// =========================================================
export const githubAuth = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "GitHub authorization code is required" });
    }

    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return res.status(401).json({ message: "Invalid GitHub code: " + tokenData.error_description });
    }

    const accessToken = tokenData.access_token;

    // Get user info from GitHub
    const [userRes, emailsRes] = await Promise.all([
      fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ]);

    const githubUser = await userRes.json();
    const emails = await emailsRes.json();

    const githubId = String(githubUser.id);
    const name = githubUser.name || githubUser.login;
    const avatar = githubUser.avatar_url || "";

    // Get primary email
    const primaryEmail = Array.isArray(emails)
      ? emails.find((e) => e.primary)?.email || emails[0]?.email
      : githubUser.email;

    if (!primaryEmail) {
      return res.status(400).json({ message: "Could not get email from GitHub. Make sure your email is public or grant email permission." });
    }

    // Check if user exists
    let user = await User.findOne({
      $or: [{ githubId }, { email: primaryEmail }],
    });

    if (user) {
      if (!user.githubId) {
        user.githubId = githubId;
        user.authProvider = user.authProvider === "local" ? "local" : "github";
        if (!user.avatar && avatar) user.avatar = avatar;
        await user.save({ validateBeforeSave: false });
      }
    } else {
      user = await User.create({
        name,
        email: primaryEmail,
        githubId,
        authProvider: "github",
        avatar,
        role: "student",
      });
    }

    const token = generateToken(user);

    logger.info({ userId: user._id, provider: "github" }, "OAuth login");

    res.json({
      message: "Login successful",
      token,
      user: buildUserResponse(user),
    });
  } catch (error) {
    logger.error({ err: error }, "GitHub OAuth failed");
    res.status(500).json({ message: "GitHub authentication failed" });
  }
};
