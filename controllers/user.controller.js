import User from "../models/users.model.js";
import AppError from "../utils/error.util.js";
import cloudinary from "cloudinary";
import fs from "fs/promises";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";

const cookieOptions = {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  httpOnly: true,
  secure: true, // False for local dev
  sameSite: "Lax",
  path: "/",
};

const register = async (req, res, next) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return next(new AppError("All fields are required", 400));
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new AppError("Email already exists", 400));
  }

  const user = await User.create({
    fullName,
    email,
    password,
    avatar: {
      public_id: email,
      secure_url:
        "data:image/jpeg;base64,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",
    },
  });

  if (!user) {
    return next(new AppError("User registration failed, please try again", 400));
  }

  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
        width: 250,
        height: 250,
        gravity: "faces",
        crop: "fill",
      });
      if (result) {
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.secure_url;
        await fs.rm(`uploads/${req.file.filename}`);
      }
    } catch (error) {
      return next(new AppError(error.message || "File not uploaded, please try again", 500));
    }
  }

  await user.save();
  user.password = undefined;

  const token = await user.generateJWTToken();
  console.log("Setting cookie for user:", { userId: user._id, email, role: user.role });

  res.cookie("token", token, cookieOptions);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user,
  });
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new AppError("All fields are required", 400));
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError("Email or password does not match", 400));
    }

    const token = await user.generateJWTToken();
    console.log("Setting cookie for user:", { userId: user._id, email, role: user.role });

    user.password = undefined;

    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user,
    });
  } catch (err) {
    return next(new AppError(err.message, 500));
  }
};

const logout = async (req, res) => {
  res.cookie("token", null, {
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
  });
  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
};

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    res.status(200).json({
      success: true,
      message: "User details",
      user,
    });
  } catch (e) {
    return next(new AppError("Failed to fetch user detail", 500));
  }
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Email is required", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("Email not registered", 400));
  }

  try {
    const resetToken = await user.generatePasswordResetToken();
    await user.save();

    const resetPasswordUrl = `${process.env.FRONTED_URL}/reset-password/${resetToken}`;
    console.log("Reset password URL:", resetPasswordUrl);

    const subject = "Password Reset Request";
    const message = `
      <h1>Password Reset</h1>
      <p>You requested a password reset for your LMS account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetPasswordUrl}">${resetPasswordUrl}</a>
      <p>This link expires in 15 minutes.</p>
      <p>If you didn’t request this, ignore this email.</p>
    `;

    await sendEmail(email, subject, message);

    res.status(200).json({
      success: true,
      message: `Reset password link sent to ${email} successfully`,
    });
  } catch (error) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save();
    return next(new AppError("Failed to send reset email", 500));
  }
};

const resetPassword = async (req, res, next) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  const forgotPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    forgotPasswordToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or expired, please try again", 400));
  }

  user.password = password;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
};

const changePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const { id } = req.user;

  if (!oldPassword || !newPassword) {
    return next(new AppError("All fields are mandatory", 400));
  }

  const user = await User.findById(id).select("+password");
  if (!user) {
    return next(new AppError("User does not exist", 400));
  }

  const isPasswordValid = await user.comparePassword(oldPassword);
  if (!isPasswordValid) {
    return next(new AppError("Invalid old password", 400));
  }

  user.password = newPassword;
  await user.save();

  user.password = undefined;

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
};

const updateUser = async (req, res, next) => {
  console.log("route hited")
  const { fullName } = req.body;
  const id = req.user.id;

  const user = await User.findById(id);

  if (!user) {
    return next(new AppError("User does not exist", 400));
  }

  if (fullName) {
    user.fullName = fullName;
  }

  if (req.file) {
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
        width: 250,
        height: 250,
        gravity: "faces",
        crop: "fill",
      });
      if (result) {
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.secure_url;
        await fs.rm(`uploads/${req.file.filename}`);
      }
    } catch (error) {
      return next(new AppError(error.message || "File not uploaded, please try again", 500));
    }
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    user,
  });
};

export {
  login,
  logout,
  register,
  getProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  updateUser,
};