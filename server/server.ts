import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import http from "http";
import ejs from 'ejs'
import session from 'express-session';
import flash from 'connect-flash';
import cookieParser from "cookie-parser";
import MongoStore from 'connect-mongo';
import cors from 'cors'
import { connectDatabase } from './config/dbConnection';
import { createDefaultRoles } from './middleware/role.middleware';
import { swaggerSetup } from "./swagger";

import { Server } from "socket.io";
import { socketHandler } from './socketServer';

connectDatabase()

const app = express();
const server = http.createServer(app);
swaggerSetup(app);

// Routers

import { userRouter } from './routes/user.route';
import { movieRouter } from './routes/movie.route';
import { theaterRouter } from './routes/theater.route';
import { showRouter } from './routes/show.route';
import { bookingRouter } from './routes/booking.route';
import { paymentRouter } from './routes/payment.route';
import { ticketRouter } from './routes/ticket.route';

import { showRepository } from "./repository/show.repo";
import { homeRouter } from './routes/ejsRouter/auth.route';

import { chatRouter } from './routes/chat.route';


// /
app.use(cookieParser());

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],

}))

// ---------------- Socket.IO Setup ----------------

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
    // Add these for better stability
    pingTimeout: 60000,
    pingInterval: 25000,
});
socketHandler(io);

// Body Parsers
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'MyS3cr3tK3Yforemost345',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        httpOnly: true,
        secure: false
        // secure: process.env.NODE_ENV === 'development'
    }
}));

// Flash middleware (MUST be after session)
app.use(flash());

// Make flash messages available in all responses
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.warning_msg = req.flash('warning_msg');
    res.locals.info_msg = req.flash('info_msg');

    // User info (if any)
    res.locals.user = req.user || null;

    next();
});

app.use(createDefaultRoles);

// Home Router
app.use('/admin', homeRouter)
// Router
app.use('/auth', userRouter)
// Movie
app.use('/movies', movieRouter)
// Theater
app.use('/theaters', theaterRouter)
// Show
app.use('/shows', showRouter)
// Booking
app.use('/booking', bookingRouter)
//Payment
app.use('/payment', paymentRouter)
//chat
app.use("/chats", chatRouter);
// Ticket
app.use('/tickets', ticketRouter)

// console.log("RUNNING MODE:", process.env.NODE_ENV);

server.listen(process.env.PORT, () =>
    console.log(`Server is listening on port http://localhost:${process.env.PORT}`)
)
