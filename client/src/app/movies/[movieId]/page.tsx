"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Box,
    Typography,
    Container,
    Button,
    CircularProgress,
    Alert,
    Paper,
    Chip
} from "@mui/material";
import { AccessTime, CalendarToday, Language, Star, LocalMovies, People } from "@mui/icons-material";
import { getMovieById } from "@/app/api/movie.endpoint";

interface Movie {
    _id: string;
    moviename: string;
    genre: string;
    language: string;
    duration: string;
    cast: string[];
    director: string[];
    releaseDate: string;
    description: string;
    poster: string;
    rating: number;
    votes?: number;
    likes?: number;
    promoted?: boolean;
}

const MovieDetailsPage = () => {
    const params = useParams();
    const router = useRouter();
    const movieId = params?.movieId as string;

    const [movie, setMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!movieId) {
            setError("Movie ID not found");
            setLoading(false);
            return;
        }

        const fetchMovie = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await getMovieById(movieId);
                const movieData = response?.data;

                if (movieData) {
                    setMovie(movieData);
                } else {
                    setError("Movie data not found");
                }
            } catch (err) {
                setError("Failed to load movie");
            } finally {
                setLoading(false);
            }
        };

        fetchMovie();
    }, [movieId]);

    const handleBooking = () => {
        if (movieId) {
            router.push(`/theaters/${movieId}`);
        }
    };

    if (loading) {
        return (
            <Box className="movies-container" sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh',
                background: 'linear-gradient(135deg, #ffffffff 0%rgba(255, 255, 255, 1)a2 100%)'
            }}>
                <Box className="loading-container" sx={{
                    textAlign: 'center',
                    // background: 'rgba(255, 255, 255, 0.95)',
                    padding: '40px',
                    // borderRadius: '20px',
                    // boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
                }}>
                    <CircularProgress size={50} sx={{
                        color: '#667eea'
                    }} />
                    <Typography variant="h6" sx={{
                        mt: 2,
                        color: '#333',
                        fontWeight: 600,
                        fontFamily: '"Roboto", sans-serif'
                    }}>
                        Loading Movies...
                    </Typography>
                </Box>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                // background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                p: 3
            }}>
                <Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
                    <Typography variant="h5" color="error" gutterBottom>
                        Please signin your account
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                        {error}
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => router.push('/movies')}
                    >
                        Back to Movies
                    </Button>
                </Paper>
            </Box>
        );
    }

    if (!movie) {
        return (
            <Box sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                // background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                p: 3
            }}>
                <Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
                    <Typography variant="h5" gutterBottom>
                        Movie Not Found
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        The movie you&apos;re looking for doesn&apos;t exist.
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => router.push('/movies')}
                    >
                        Browse Movies
                    </Button>
                </Paper>
            </Box>
        );
    }

    const genreArray = movie.genre ? movie.genre.split(',').map(g => g.trim()) : [];

    return (
        <Box sx={{
            minHeight: "100vh",
            position: "relative"
        }}>
            {/* Background Image with Overlay */}
            <Box sx={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9)), url(${movie.poster})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
                zIndex: 0
            }} />

            {/* Content */}
            <Box sx={{ position: "relative", zIndex: 1 }}>
                {/* Hero Section */}
                <Box sx={{
                    py: { xs: 4, sm: 6, md: 8 },
                    color: "white"
                }}>
                    <Container maxWidth="lg">
                        <Box sx={{
                            display: "flex",
                            flexDirection: { xs: "column", md: "row" },
                            gap: { xs: 4, md: 6 },
                            alignItems: { xs: "center", md: "flex-start" }
                        }}>
                            {/* Movie Poster */}
                            <Box sx={{
                                width: { xs: "100%", sm: "300px", md: "400px" },
                                flexShrink: 0,
                                position: "relative"
                            }}>
                                <Paper elevation={10} sx={{
                                    borderRadius: 3,
                                    overflow: "hidden",
                                    "&:hover": {
                                        transform: "translateY(-8px)",
                                        transition: "transform 0.3s ease"
                                    }
                                }}>
                                    <Box
                                        component="img"
                                        src={movie.poster}
                                        alt={movie.moviename}
                                        sx={{
                                            width: "100%",
                                            height: "auto",
                                            display: "block"
                                        }}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/images/movie-placeholder.jpg';
                                        }}
                                    />
                                </Paper>
                            </Box>

                            {/* Movie Info */}
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h2" gutterBottom sx={{
                                    fontWeight: 700,
                                    fontSize: { xs: "2.5rem", sm: "3rem", md: "3.5rem" },
                                    background: "linear-gradient(45deg, #FFD700 30%, #FFA500 90%)",
                                    backgroundClip: "text",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent"
                                }}>
                                    {movie.moviename}
                                </Typography>

                                {/* Rating Badge */}
                                <Box sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    backgroundColor: "rgba(255, 215, 0, 0.2)",
                                    px: 2,
                                    py: 0.5,
                                    borderRadius: 2,
                                    mb: 3,
                                    border: "1px solid rgba(255, 215, 0, 0.3)"
                                }}>
                                    <Star sx={{ color: "#FFD700", mr: 1 }} />
                                    <Typography variant="h6" sx={{ color: "#FFD700", fontWeight: 600 }}>
                                        {movie.rating}/10
                                    </Typography>
                                </Box>

                                {/* Info Row */}
                                <Box sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 2,
                                    mb: 4
                                }}>
                                    <Chip
                                        icon={<AccessTime />}
                                        label={movie.duration}
                                        sx={{
                                            backgroundColor: "rgba(33, 150, 243, 0.2)",
                                            color: "white",
                                            border: "1px solid rgba(33, 150, 243, 0.3)"
                                        }}
                                    />
                                    <Chip
                                        icon={<Language />}
                                        label={movie.language}
                                        sx={{
                                            backgroundColor: "rgba(76, 175, 80, 0.2)",
                                            color: "white",
                                            border: "1px solid rgba(76, 175, 80, 0.3)"
                                        }}
                                    />
                                    <Chip
                                        icon={<CalendarToday />}
                                        label={movie.releaseDate}
                                        sx={{
                                            backgroundColor: "rgba(156, 39, 176, 0.2)",
                                            color: "white",
                                            border: "1px solid rgba(156, 39, 176, 0.3)"
                                        }}
                                    />
                                </Box>

                                {/* Genres */}
                                <Box sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 1,
                                    mb: 4
                                }}>
                                    {genreArray.map((genre, index) => (
                                        <Chip
                                            key={index}
                                            label={genre}
                                            sx={{
                                                backgroundColor: "rgba(255, 87, 34, 0.2)",
                                                color: "white",
                                                border: "1px solid rgba(255, 87, 34, 0.3)",
                                                fontWeight: 500
                                            }}
                                        />
                                    ))}
                                </Box>

                                {/* Description */}
                                <Typography variant="body1" sx={{
                                    mb: 4,
                                    lineHeight: 1.8,
                                    fontSize: { xs: "1rem", sm: "1.1rem" },
                                    maxWidth: "800px",
                                    color: "rgba(255, 255, 255, 0.9)"
                                }}>
                                    {movie.description}
                                </Typography>

                                {/* Primary Book Button */}
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<LocalMovies />}
                                    onClick={handleBooking}
                                    sx={{
                                        background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
                                        color: "white",
                                        px: { xs: 4, sm: 5 },
                                        py: { xs: 1.5, sm: 1.75 },
                                        fontSize: { xs: "1rem", sm: "1.1rem" },
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        "&:hover": {
                                            background: "linear-gradient(45deg, #FF8E53 30%, #FE6B8B 90%)",
                                            transform: "scale(1.05)",
                                            boxShadow: "0 4px 20px rgba(254, 107, 139, 0.4)"
                                        },
                                        transition: "all 0.3s ease"
                                    }}
                                >
                                    Book Tickets Now
                                </Button>
                            </Box>
                        </Box>
                    </Container>
                </Box>

                {/* Details Cards Section */}
                <Container maxWidth="lg" sx={{ pb: { xs: 4, sm: 6, md: 8 } }}>
                    <Typography variant="h4" gutterBottom sx={{
                        mb: 4,
                        color: "white",
                        textAlign: "center",
                        fontWeight: 600
                    }}>
                        Movie Details
                    </Typography>

                    <Box sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        flexWrap: "wrap",
                        gap: 3,
                        justifyContent: "center"
                    }}>
                        {/* Release Date Card */}
                        <Paper elevation={3} sx={{
                            flex: { xs: "1 1 100%", sm: "1 1 280px" },
                            p: 3,
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: 2,
                            color: "white"
                        }}>
                            <CalendarToday sx={{ color: "#4FC3F7", fontSize: 40, mb: 2 }} />
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Release Date
                            </Typography>
                            <Typography variant="body1">
                                {movie.releaseDate}
                            </Typography>
                        </Paper>

                        {/* Director Card */}
                        <Paper elevation={3} sx={{
                            flex: { xs: "1 1 100%", sm: "1 1 280px" },
                            p: 3,
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: 2,
                            color: "white"
                        }}>
                            <People sx={{ color: "#81C784", fontSize: 40, mb: 2 }} />
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Director{movie.director.length > 1 ? 's' : ''}
                            </Typography>
                            <Typography variant="body1">
                                {movie.director.join(', ')}
                            </Typography>
                        </Paper>

                        {/* Cast Card */}
                        <Paper elevation={3} sx={{
                            flex: { xs: "1 1 100%", sm: "1 1 280px" },
                            p: 3,
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: 2,
                            color: "white"
                        }}>
                            <AccessTime sx={{ color: "#FFB74D", fontSize: 40, mb: 2 }} />
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Duration & Cast
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                {movie.duration}
                            </Typography>
                            <Typography variant="body1">
                                {movie.cast.slice(0, 3).join(', ')}
                                {movie.cast.length > 3 && '...'}
                            </Typography>
                        </Paper>

                        {/* Votes Card */}
                        <Paper elevation={3} sx={{
                            flex: { xs: "1 1 100%", sm: "1 1 280px" },
                            p: 3,
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: 2,
                            color: "white"
                        }}>
                            <Star sx={{ color: "#FFD700", fontSize: 40, mb: 2 }} />
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Rating & Votes
                            </Typography>
                            <Typography variant="body1">
                                {movie.rating}/10 • {movie.votes?.toLocaleString() || 0} votes
                            </Typography>
                        </Paper>
                    </Box>

                    {/* Bottom Book Button */}
                    <Box sx={{
                        display: "flex",
                        justifyContent: "center",
                        mt: 6
                    }}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<LocalMovies />}
                            onClick={handleBooking}
                            sx={{
                                background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                                color: "white",
                                px: { xs: 5, sm: 6 },
                                py: { xs: 1.5, sm: 2 },
                                fontSize: { xs: "1.1rem", sm: "1.2rem" },
                                fontWeight: 600,
                                borderRadius: 2,
                                "&:hover": {
                                    background: "linear-gradient(45deg, #21CBF3 30%, #2196F3 90%)",
                                    transform: "scale(1.05)",
                                    boxShadow: "0 4px 20px rgba(33, 150, 243, 0.4)"
                                },
                                transition: "all 0.3s ease"
                            }}
                        >
                            Secure Your Seats Now
                        </Button>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
}

export default MovieDetailsPage;