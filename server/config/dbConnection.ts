//importing modules
import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

//details from the env
const username = process.env.DB_USERNAME
const password = process.env.DB_PASSWORD
const dbName = 'Movie_Ticket_Booking'

const connectionString = `mongodb+srv://${username}:${password}@cluster0.ewwcraz.mongodb.net/${dbName}?retryWrites=true&w=majority&appName=Cluster0`


//db connection
export const connectDatabase = async (): Promise<void> => {
    try {
        // const options: mongoose.ConnectOptions = {
        //     serverSelectionTimeoutMS: 50000, // Increase timeout to 50 seconds
        //     socketTimeoutMS: 45000, // Socket timeout
        //     connectTimeoutMS: 30000, // Connection timeout
        //     retryWrites: true,
        //     retryReads: true,
        // };

        await mongoose.connect(connectionString)
        console.log(`Database connection succeffully ✔ to ${dbName}`)


        // Listen to connection events
        // mongoose.connection.on('error', (err) => {
        //     console.error('MongoDB connection error:', err);
        // });

        // mongoose.connection.on('disconnected', () => {
        //     console.log('MongoDB disconnected');
        // });

    } catch (error) {
        console.error('Database connection error:', error);

        // More specific error messages
        // if (error instanceof mongoose.Error.MongooseServerSelectionError) {
        //     throw new Error('Cannot connect to MongoDB Atlas. Check your internet connection and IP whitelist.');
        // }

        // if (error instanceof Error && error.message.includes('Authentication failed')) {
        //     throw new Error('MongoDB authentication failed. Check your username and password.');
        // }

        throw new Error(`Connection failed: No internet connection or MongoDB server unreachable.`);
    }
};

