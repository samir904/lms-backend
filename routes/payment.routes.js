import { Router } from "express";
import { allPayments, buySubscription, cancelSubscription, getPaymentRecords, getRazorpayApiKey, getStats, verifySubscription } from "../controllers/payment.controller.js";
import { authorizedRoles, isLoggedIn } from "../middlewares/auth.middleware.js";

const router=Router();

router.get("/stats", isLoggedIn, authorizedRoles("ADMIN"), getStats);
router.get("/records", isLoggedIn, authorizedRoles("ADMIN"), getPaymentRecords);
router.route("/razorpay-key")
        .get(
            isLoggedIn,
            getRazorpayApiKey
        )

router
.route("/subscribe")
.post(
    isLoggedIn,
    buySubscription
)

router.route("/verify")
        .post(
            isLoggedIn,
            verifySubscription
        )

router.route("/unsubscribe")
.post(
    isLoggedIn,
    cancelSubscription
)

router
  .route("/")
  .get(isLoggedIn, authorizedRoles("ADMIN"), allPayments); // Added "ADMIN"
export default router;