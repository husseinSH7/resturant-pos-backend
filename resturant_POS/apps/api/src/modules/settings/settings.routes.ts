import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import {
  getRestaurant,
  updateRestaurant,
  getTax,
  updateTax,
  getReceipt,
  updateReceipt,
} from "./settings.controller.js";

const router = Router();

router.get("/restaurant", auth, getRestaurant);
router.put("/restaurant", auth, updateRestaurant);
router.get("/tax", auth, getTax);
router.put("/tax", auth, updateTax);
router.get("/receipt", auth, getReceipt);
router.put("/receipt", auth, updateReceipt);

export default router;