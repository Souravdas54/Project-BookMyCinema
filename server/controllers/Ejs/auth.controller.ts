import { Request, Response } from "express";
import { movieRepositories } from "../../repository/movie.repo";
import { movieModel } from "../../models/movie.model";
import { theaterRepositories } from "../../repository/theater.repo";
import { theaterModel } from "../../models/theaters.model";
import { bookingModel } from "../../models/booking.model";
import { showModel } from "../../models/show.model";
import { userModel } from "../../models/user.Model";

class HomeController {

    async admin_chat(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                return res.redirect('/admin/login');
            }

            const adminUser = await userModel.findById(req.user.userId).lean();

            if (!adminUser) {
                return res.redirect('/admin/login');
            }
            res.render('admin-chat', {
                title: "Chat",
                admin: {
                    _id: adminUser._id,
                    name: adminUser.name,
                    email: adminUser.email,
                    profilePicture: adminUser.profilePicture || null
                }

            })
        } catch (error) {
            console.error("Admin Chat Error:", error);
            res.status(500).send("Something went wrong");
        }
    }


    async loginadmin(req: Request, res: Response) {
        res.render('login', {
            title: "Admin Login"
        });
    }

    async dashboard(req: Request, res: Response) {
        try {

            if (!req.user) {
                return res.redirect('/admin/login');
            }

            const adminUser = await userModel.findById(req.user.userId).lean();

            if (!adminUser) {
                return res.redirect('/admin/login');
            }
            // Get query parameters for pagination
            // Get query parameters

            const testStats = {
                totalBookings: 150,
                todayBookings: 15,
                totalRevenue: 5500,
                activeMovies: 8,
                occupancyRate: 50
            };

            res.render('dashboard', {
                title: "Admin Dashboard",
                admin: {
                    _id: adminUser._id,
                    name: adminUser.name,
                    email: adminUser.email,
                    profilePicture: adminUser.profilePicture || null
                },
                bookings: [], // Empty initially, will load via API
                currentStatus: 'Paid',
                pagination: {
                    currentPage: 1,
                    itemsPerPage: 10,
                    totalItems: 0,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false
                },
                stats: testStats
            });
        } catch (error) {
            console.error("Dashboard error:", error);
            res.render('dashboard', {
                title: "Admin Dashboard",
                user: req.user,
                bookings: [],
                currentStatus: 'Paid',
                pagination: {
                    currentPage: 1,
                    itemsPerPage: 10,
                    totalItems: 0,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false
                },
                stats: {
                    totalBookings: 0,
                    todayBookings: 0,
                    totalRevenue: 0,
                    activeMovies: 0,
                    occupancyRate: 0
                }
            });
        }
    }

    async create_movie(req: Request, res: Response) {
        try {

            console.log("=== CREATE MOVIE PAGE ===");
            console.log("Flash messages:", {
                success: req.flash('success_msg'),
                error: req.flash('error_msg'),
                warning: req.flash('warning_msg'),
                info: req.flash('info_msg')
            });
            res.render('cinemas/create_cinema', {
                title: "Create Cinema",

                movieData: null,

            });


        } catch (error) {
            console.error("Error in create_movie:", error);
             req.flash('error_msg', 'Failed to load movie creation page');
            res.redirect('/admin/cinemas/create-cinema');
        }

    }

    async create_show(req: Request, res: Response) {
        try {

           

            // const theaters = await theaterModel.find();
            const movies = await movieModel.find();

            const theaters = await theaterModel.aggregate([
                {
                    $lookup: {
                        from: 'movies', // The collection name for movies (usually plural)
                        localField: 'assignedMovies',
                        foreignField: '_id',
                        as: 'assignedMoviesDetails'
                    }
                },
                {
                    $project: {
                        theatername: 1,
                        theatercity: 1,
                        screenNumbers: 1,
                        assignedMovies: 1, // Keep ObjectIds
                        assignedMoviesDetails: { // Include movie details
                            _id: 1,
                            title: 1,
                            duration: 1,
                            genre: 1
                        },

                    }
                }
            ]);

            res.render('cinemas/create_show', {
                title: "Create Show",

                theaters: theaters || [],
                movies: movies || [],
                
            });
        } catch (error) {
            console.log(error);
            req.flash('error', 'Error loading create show page');
            res.redirect('/admin/dashboard');
        }

    }

    async create_theater(req: Request, res: Response) {
        try {
            // const theaterData = {};

            const movies = await movieRepositories.find(); // get all movies

            res.render('cinemas/create_theater', {
                title: "Create Theater",
                // success: req.query.success || null,
                // error: req.query.error || null,
                // theaterData: theaterData
                theatersData: null,
                movies: movies
            });

        } catch (error) {
            console.log(error);
            res.render('cinemas/create_theater', {
                title: "Create Theater",
                theatersData: null,
                movies: []
            });
        }

    }

    async movie_list(req: Request, res: Response) {
        try {
            console.log("Fetching movies for movie_list page...");


            const getAllMovies = await movieRepositories.find();
            console.log(`Found ${getAllMovies ? getAllMovies.length : 0} movies`);


            if (!getAllMovies || getAllMovies.length === 0) {
                console.log("No movies found in database");
                return res.render('details/movies', {
                    title: "Movies List",
                    movies: [],
                    totalMovies: 0,
                    promotedMovies: 0,
                    activeMovies: 0,
                    recentMovies: 0,
                    currentPage: 1,
                    totalPages: 1,
                    searchQuery: '',
                    genreFilter: '',
                    statusFilter: '',
                    error: "No movies found. Please add your first movie!"
                });
            }


            const totalMovies = getAllMovies.length;

            // Promoted movies
            const promotedMovies = getAllMovies.filter(movie =>
                movie.promoted === true
            ).length;

            // Active movies (last 6 months)
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            const activeMovies = getAllMovies.filter(movie => {
                const releaseDate = new Date(movie.releaseDate);
                return releaseDate >= sixMonthsAgo;
            }).length;

            // Recent movies (this month)
            const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const recentMovies = getAllMovies.filter(movie => {
                const createdAt = new Date(movie.createdAt || movie.releaseDate);
                return createdAt >= monthStart;
            }).length;

            // alculate pagenation
            const itemsPerPage = 10;
            const totalPages = Math.ceil(totalMovies / itemsPerPage);
            const currentPage = 1;

            // Data Send EJS 
            console.log(`Rendering movies page with ${totalMovies} movies`);

            res.render('details/movies', {
                title: "Movies List",
                movies: getAllMovies,
                totalMovies,
                promotedMovies,
                activeMovies,
                recentMovies,
                currentPage,
                totalPages,
                searchQuery: '',
                genreFilter: '',
                statusFilter: '',
                // success: req.flash('success'),
                // error: req.flash('error')
            });

        } catch (error: any) {
            console.error("Error in movie_list controller:", error);
            console.error("Error stack:", error.stack);


            res.render('details/movies', {
                title: "Movies List",
                movies: [],
                totalMovies: 0,
                promotedMovies: 0,
                activeMovies: 0,
                recentMovies: 0,
                currentPage: 1,
                totalPages: 1,
                searchQuery: '',
                genreFilter: '',
                statusFilter: '',
                error: "Failed to load movies. Please try again later."
            });
        }
    }

    async theater(req: Request, res: Response) {
        try {
            const theaters = await theaterRepositories.findAll();
            res.render('details/theaters', {
                title: "Theaters List",
                theaters: theaters || [],
                success: req.query.success,
                error: req.query.error
            });

        } catch (error) {
            console.error("Error in theater controller:", error);

            res.render('details/theaters', {
                title: "Theaters List",
                theaters: [],
                error: "Failed to load theaters"
            });
        }
    }

    async show_details(req: Request, res: Response) {
        try {
            // Fetch all shows from database
            const shows = await showModel.find()
                .populate('movieId', 'moviename')
                .populate('theaterId', 'theatername')
                .sort({ date: -1, 'timeSlots.time': 1 })
                .lean();

            // Format shows data for EJS
            const formattedShows = shows.map(show => ({
                _id: show._id,
                movieId: show.movieId,
                theaterId: show.theaterId,
                room: show.room,
                screenNumber: show.screenNumber,
                date: show.date,
                timeSlots: show.timeSlots,
                availableCategories: show.timeSlots?.[0]?.availableCategories || [],
                totalSeats: show.totalSeats,
                bookedSeats: show.bookedSeats || [],
                createdAt: show.createdAt
            }));

            res.render('details/shows', {
                title: "Show Details",
                shows: formattedShows,
                success: req.query.success,
                error: req.query.error
            });
        } catch (error) {
            console.error("Controller Error - show_details:", error);
            res.render('details/shows', {
                title: "Show Details",
                shows: [],
                error: "Failed to load shows"
            });
        }
    }
}

export const homeController = new HomeController();
