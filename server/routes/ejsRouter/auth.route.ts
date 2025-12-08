import { Router } from "express";
import { homeController } from "../../controllers/Ejs/auth.controller";
import { userController } from "../../controllers/user.controller";
import { movieControllers } from "../../controllers/movie.controller";
import { CreateuploadFolder } from "../../middleware/upload.middleware";
import { adminController } from "../../controllers/Ejs/admim.ejs.controller";
import { authorizeRoles, protect, refreshTokenProtect } from "../../middleware/user.middleaware";
import { allTheaterController } from "../../controllers/theater.controller";
import { allShowController } from "../../controllers/show.controller";

const homeRouter = Router();
const upload = CreateuploadFolder('movies') // Create Folder name

// LOGIN PAGE
homeRouter.get('/login', homeController.loginadmin);
homeRouter.post('/login', adminController.admin_login)

// DASHBOARD
homeRouter.get("/dashboard", protect, authorizeRoles('admin'), homeController.dashboard);
homeRouter.get('/refresh-token', refreshTokenProtect, adminController.admin_refreshToken);


// CINEMA
homeRouter.get('/cinemas/create-cinema', homeController.create_movie);

homeRouter.post('/create/cinema', protect, authorizeRoles('admin'), upload.single('poster'), movieControllers.movieCreate);

// THEATER
homeRouter.get('/cinemas/create-theater', homeController.create_theater);
homeRouter.post('/theaters/create', protect, authorizeRoles('admin'), allTheaterController.create);
homeRouter.get('/theather/list', homeController.theater);

// SHOW
homeRouter.get('/cinemas/create-show', homeController.create_show);
homeRouter.post('/shows/create', protect, authorizeRoles('admin'), allShowController.create)
homeRouter.get("/assigned-movie/:theaterId", protect, authorizeRoles('admin'), allTheaterController.getAssignedMoviesbyTheater);

homeRouter.get('/show/details', protect, authorizeRoles('admin'), homeController.show_details)

// MOVIE
homeRouter.get('/movies/list', homeController.movie_list);

// CHAT
homeRouter.get('/chat', protect, authorizeRoles('admin'), homeController.admin_chat);

// Movie list page (rendered)
// homeRouter.get('/movies/list',  movieControllers.getAllovies);



export { homeRouter };
