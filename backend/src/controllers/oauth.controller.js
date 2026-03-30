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

// Helper: login existing user or signal new user needs role selection
const handleOAuthUser = async ({ provider, providerId, email, name, avatar, res }) => {
  const providerIdField = provider === "google" ? "googleId" : "githubId";

  // Check if user exists
  let user = await User.findOne({
    $or: [{ [providerIdField]: providerId }, { email }],
  });

  if (user) {
    // Existing user — link provider if needed, then login
    if (!user[providerIdField]) {
      user[providerIdField] = providerId;
      if (!user.avatar && avatar) user.avatar = avatar;
      await user.save({ validateBeforeSave: false });
    }

    const token = generateToken(user);
    logger.info({ userId: user._id, provider }, "OAuth login (existing user)");

    return res.json({
      message: "Login successful",
      token,
      user: buildUserResponse(user),
      isNewUser: false,
    });
  }

  // New user — return OAuth data for role selection
  logger.info({ email, provider }, "New OAuth user — needs role selection");

  return res.json({
    message: "New user — please select a role",
    isNewUser: true,
    oauthData: {
      provider,
      providerId,
      email,
      name,
      avatar,
    },
  });
};

// =========================================================
// 1. GOOGLE OAuth
// =========================================================
export const googleAuth = async (req, res) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Google authorization code is required" });
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!googleClientId || !googleClientSecret) {
      logger.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in env");
      return res.status(500).json({ message: "Server OAuth configuration error" });
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      logger.error({ error: tokenData.error, desc: tokenData.error_description, redirectUri }, "Google token exchange failed");
      return res.status(401).json({ message: "Google authentication failed: " + (tokenData.error_description || tokenData.error) });
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

    await handleOAuthUser({
      provider: "google",
      providerId: googleId,
      email,
      name,
      avatar: picture || "",
      res,
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
      return res.status(401).json({ message: "GitHub auth failed: " + tokenData.error_description });
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

    const primaryEmail = Array.isArray(emails)
      ? emails.find((e) => e.primary)?.email || emails[0]?.email
      : githubUser.email;

    if (!primaryEmail) {
      return res.status(400).json({ message: "Could not get email from GitHub" });
    }

    await handleOAuthUser({
      provider: "github",
      providerId: githubId,
      email: primaryEmail,
      name,
      avatar,
      res,
    });
  } catch (error) {
    logger.error({ err: error }, "GitHub OAuth failed");
    res.status(500).json({ message: "GitHub authentication failed" });
  }
};

// =========================================================
// 3. COMPLETE OAuth Registration (with role selection)
// =========================================================
export const completeOAuthRegistration = async (req, res) => {
  try {
    const { provider, providerId, email, name, avatar, role } = req.body;

    if (!provider || !providerId || !email || !name || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!["student", "organizer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Choose student or organizer." });
    }

    // Double-check user doesn't already exist
    const providerIdField = provider === "google" ? "googleId" : "githubId";
    const existing = await User.findOne({
      $or: [{ [providerIdField]: providerId }, { email }],
    });

    if (existing) {
      // User was created between steps — just login
      const token = generateToken(existing);
      return res.json({
        message: "Login successful",
        token,
        user: buildUserResponse(existing),
      });
    }

    const user = await User.create({
      name,
      email,
      [providerIdField]: providerId,
      authProvider: provider,
      avatar: avatar || "",
      role,
    });

    const token = generateToken(user);

    logger.info({ userId: user._id, provider, role }, "OAuth registration completed");

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: buildUserResponse(user),
    });
  } catch (error) {
    logger.error({ err: error }, "Complete OAuth registration failed");
    res.status(500).json({ message: "Registration failed: " + error.message });
  }
};
