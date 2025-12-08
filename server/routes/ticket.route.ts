import express from "express";
import { ticketController } from "../controllers/ticket.controller";
import { protect, authorizeRoles } from "../middleware/user.middleaware";

const ticketRouter = express.Router();

ticketRouter.get("/:bookingId", protect, ticketController.getTicketDetails);

export { ticketRouter }