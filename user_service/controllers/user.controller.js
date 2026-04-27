const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  const users = await User.findAll();
  res.json(users);
};

exports.getUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  res.json(user);
};

exports.updateUser = async (req, res) => {
  await User.update(req.body, {
    where: { id: req.params.id },
  });
  res.json({ message: "Updated" });
};

exports.deleteUser = async (req, res) => {
  await User.destroy({
    where: { id: req.params.id },
  });
  res.json({ message: "Deleted" });
};

exports.googleAuth = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Missing Google ID token" });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email ? payload.email.toLowerCase() : '';
    const google_id = payload.sub;
    const first_name = payload.given_name || payload.name?.split(' ')[0] || '';
    const last_name = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '';

    // 1. Check if user already exists
    let user = await User.findOne({ where: { email } });

    if (!user) {
      // 2. If user doesn't exist, create them
      user = await User.create({
        google_id,
        email,
        first_name,
        last_name,
        role: 'CUSTOMER' // Default role
      });
    } else if (!user.google_id) {
      // Edge case: User exists with email but no google_id, link accounts
      user.google_id = google_id;
      await user.save();
    }

    // 3. Generate internal JWT for microservices
    const internalToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: "24h" }
    );

    // 4. Return user and token
    res.status(200).json({
      message: "Authentication successful",
      token: internalToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(500).json({ error: "Internal server error during authentication" });
  }
};

exports.register = async (req, res) => {
  try {
    const { password, first_name, last_name } = req.body;
    const email = req.body.email ? req.body.email.toLowerCase() : '';
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    let user = await User.findOne({ where: { email } });
    const hashedPassword = await bcrypt.hash(password, 10);

    if (user) {
      if (!user.password) {
        user.password = hashedPassword;
        user.first_name = first_name || user.first_name;
        user.last_name = last_name || user.last_name;
        await user.save();
        return res.status(200).json({ message: "Password added to existing Google account" });
      } else {
        return res.status(400).json({ error: "User already exists with this email" });
      }
    }

    user = await User.create({
      email,
      password: hashedPassword,
      first_name,
      last_name,
      role: 'CUSTOMER'
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.body.email ? req.body.email.toLowerCase() : '';
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    // Admin login override
    if (email === "admin" && password === "admin") {
      const internalToken = jwt.sign(
        { id: "admin", email: "admin", role: "ADMIN" },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: "24h" }
      );
      return res.status(200).json({
        message: "Admin login successful",
        token: internalToken,
        user: { id: "admin", email: "admin", role: "ADMIN", first_name: "Admin", last_name: "User" }
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const internalToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Authentication successful",
      token: internalToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};