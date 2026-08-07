import { Router } from "express";
import { login, loginWithEmail, refresh, forgotPassword, resetPassword, verifyEmail, resendVerificationEmail, createOwnerInvite, acceptOwnerInvite } from "./auth.controller.js";

const router = Router();

router.post("/login", login);
router.post("/login-email", loginWithEmail);
router.post("/refresh", refresh);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);
router.post("/create-owner-invite", createOwnerInvite);
router.post("/accept-owner-invite", acceptOwnerInvite);

export default router;