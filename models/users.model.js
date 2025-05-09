import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Name is required"],
      minLength: [5, "Name must be at least 5 characters"],
      maxLength: [50, "Name should be less than 50 characters"],
      lowercase: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      match: [
        /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/,
        "Please fill in a valid email address"
      ]
    },
    password: {
      type: String,
      required: true,
      minLength: [8, "Password must be at least 8 characters"],
      select: false
    },
    avatar: {
      public_id: {
        type: String
      },
      secure_url: {
        type: String
      }
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER"
    },
    forgotPasswordToken: {
      type: String
    },
    forgotPasswordExpiry: Date,
    subscription: {
      id: {
        type: String,
        default: ""
      },
      status: {
        type: String,
        enum: ["created", "active", "cancelled", "completed"],
        default: "created"
      }
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods = {
  generateJWTToken: async function () {
    return await jwt.sign(
      {
        id: this._id,
        email: this.email,
        subscription: this.subscription,
        role: this.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRY
      }
    );
  },
  comparePassword: async function (plaintextpassword) {
    return await bcrypt.compare(plaintextpassword, this.password);
  },
  generatePasswordResetToken: async function () {
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.forgotPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000;
    return resetToken;
  }
};

const User = model("User", userSchema);
export default User;