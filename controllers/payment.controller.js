import User from "../models/users.model.js";
import AppError from "../utils/error.util.js";
import razorpay from "../server.js";
import Payment from "../models/payment.model.js";
import crypto from "crypto";
const cookieOptions = {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // False for local dev
  sameSite: "Lax",
  path: "/",
};

export const getRazorpayApiKey = (req, res, next) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID) {
      return next(new AppError("Razorpay key ID not configured", 500));
    }
    res.status(200).json({
      success: true,
      message: "Razorpay API key",
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (e) {
    console.error("Error in getRazorpayApiKey:", e);
    return next(new AppError(e.message || "Failed to retrieve Razorpay key", 500));
  }
};

export const buySubscription = async (req, res, next) => {
  try {
    console.log("buySubscription called with user:", req.user);
    const { id } = req.user;
    if (!id) {
      return next(new AppError("User ID not found in request", 400));
    }

    const user = await User.findById(id);
    if (!user) {
      return next(new AppError("Unauthorized, please login", 400));
    }

    if (user.role === "ADMIN") {
      return next(new AppError("Admin cannot purchase a subscription", 400));
    }

    if (!process.env.RAZORPAY_PLAN_ID) {
      return next(new AppError("Razorpay plan ID not configured", 500));
    }

    console.log("Creating subscription with plan_id:", process.env.RAZORPAY_PLAN_ID);
    let subscription;
    try {
      subscription = await razorpay.subscriptions.create({
        plan_id: process.env.RAZORPAY_PLAN_ID,
        customer_notify: 1,
        total_count: 12
      });
      console.log("Subscription created:", subscription);
    } catch (razorpayError) {
      console.error("Razorpay create subscription error:", razorpayError);
      return next(new AppError(`Razorpay error: ${razorpayError.message || "Failed to create subscription"}`, 500));
    }

    if (!subscription.id) {
      return next(new AppError("Failed to create subscription: No ID returned", 500));
    }
    if (user.subscription?.id && user.subscription?.status === "created") {
      console.log("Using existing subscription:", user.subscription);
      return res.status(200).json({
          success: true,
          message: "Subscription already exists",
          subscription_id: user.subscription.id
      });
  }

    user.subscription = user.subscription || {};
    user.subscription.id = subscription.id;
    user.subscription.status = subscription.status;

    try {
      await user.save({ validateBeforeSave: false });
      console.log("User updated with subscription:", user.subscription);
    } catch (saveError) {
      console.error("Error saving user in buySubscription:", saveError);
      return next(new AppError("Failed to save user subscription", 500));
    }

    res.status(200).json({
      success: true,
      message: "Subscribed successfully",
      subscription_id: subscription.id
    });
  } catch (e) {
    console.error("Error in buySubscription:", e);
    return next(new AppError(e.message || "Failed to create subscription", 500));
  }
};

export const verifySubscription = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { razorpay_payment_id, razorpay_signature, razorpay_subscription_id } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return next(new AppError("User does not exist", 400));
    }

    const subscriptionId = user.subscription.id;
    if (!subscriptionId) {
      return next(new AppError("No subscription ID found for user", 400));
    }
    
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");
      console.log("VerifySubscription inputs:", {
        razorpay_payment_id,
        razorpay_subscription_id,
        razorpay_signature,
        subscriptionId,
        generatedSignature
      });
  
    if (generatedSignature !== razorpay_signature) {
      return next(new AppError("Payment not verified, please try again", 400));
    }

    await Payment.create({
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id
    });

    user.subscription.status = "active";
    try {
      await user.save({ validateBeforeSave: false });
      console.log("User updated in verifySubscription:", user.subscription);
    } catch (saveError) {
      console.error("Error saving user in verifySubscription:", saveError);
      return next(new AppError("Failed to save user subscription status", 500));
    }
    const token = await user.generateJWTToken();
    res.cookie("token", token, cookieOptions);
    res.status(200).json({
      success: true,
      message: "Payment verified successfully!",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
        avatar: user.avatar
      }
    });
  } catch (e) {
    console.error("Error in verifySubscription:", e);
    return next(new AppError(e.message || "Failed to verify payment", 500));
  }
};

export const cancelSubscription = async (req, res, next) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id);
    if (!user) {
      return next(new AppError("User does not exist", 400));
    }
    if (user.role === "ADMIN") {
      return next(new AppError("Admin cannot cancel a subscription", 400));
    }

    const subscriptionId = user.subscription?.id;
    if (!subscriptionId) {
      return next(new AppError("No active subscription found", 400));
    }

    console.log("Attempting to cancel subscription ID:", subscriptionId);
    //let subscription;
    //console.log("Attempting to cancel subscription ID:", subscriptionId);
        // Fetch subscription details from Razorpay
        let subscription;
        try {
            subscription = await razorpay.subscriptions.fetch(subscriptionId);
            console.log("Subscription details:", subscription);
        } catch (fetchError) {
            console.error("Razorpay fetch subscription error:", fetchError);
            return next(new AppError("Failed to fetch subscription details", 500));
        }

        // Check subscription status
        if (subscription.status === "completed") {
            return next(new AppError("Subscription is already completed and cannot be cancelled", 400));
        }
        if (subscription.status !== "active" && subscription.status !== "pending") {
          return next(new AppError(`Subscription is in ${subscription.status} status and cannot be cancelled`, 400));
      }
    try {
      subscription = await razorpay.subscriptions.cancel(subscriptionId);
      console.log("Razorpay cancel response:", subscription);
    } catch (razorpayError) {
      console.error("Razorpay cancel error:", {
        message: razorpayError.message,
        status: razorpayError.status,
        error: razorpayError.error
      });
      return next(new AppError(`Razorpay error: ${razorpayError.message || "Failed to cancel subscription"}`, razorpayError.status || 500));
    }

    user.subscription.status = subscription.status || "cancelled";
    try {
      await user.save({ validateBeforeSave: false });
      console.log("User updated in cancelSubscription:", user.subscription);
    } catch (saveError) {
      console.error("Error saving user in cancelSubscription:", saveError);
      return next(new AppError("Failed to save user subscription status", 500));
    }

    res.status(200).json({
      success: true,
      message: "Successfully canceled the subscription",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
        avatar: user.avatar
      }
    });
  } catch (e) {
    console.error("Error in cancelSubscription:", e);
    return next(new AppError(e.message || "Failed to cancel subscription", 500));
  }
};

export const allPayments = async (req, res, next) => {
  try {
    const { count } = req.query;
    const subscriptions = await razorpay.subscriptions.all({
      count: count || 10
    });

    res.status(200).json({
      success: true,
      message: "All payments",
      subscriptions
    });
  } catch (e) {
    console.error("Error in allPayments:", e);
    return next(new AppError(e.message || "Failed to fetch payments", 500));
  }
};

export const getStats = async (req, res, next) => {
  try {
    const allUsersCount = await User.countDocuments();
    const subscribedCount = await Payment.countDocuments({ status: "success" });

    res.status(200).json({
      success: true,
      message: "Stats fetched successfully",
      allUsersCount,
      subscribedCount,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

export const getPaymentRecords = async (req, res, next) => {
  try {
    const { count = 100 } = req.query;
    const allPayments = await Payment.find({})
      .sort({ createdAt: -1 })
      .limit(parseInt(count));

    const finalMonths = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthlySalesRecord = Array(12).fill(0);

    allPayments.forEach((payment) => {
      if (payment.status === "success") {
        const monthIndex = new Date(payment.createdAt).getMonth();
        monthlySalesRecord[monthIndex] += payment.amount || 0;
      }
    });

    res.status(200).json({
      success: true,
      message: "Payment records fetched successfully",
      allPayments,
      finalMonths,
      monthlySalesRecord,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};