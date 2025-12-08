"use client";

import React, { useEffect, useState } from "react";
import { getAllMovies } from "../api/movie.endpoint";
import { useRouter } from "next/navigation";
import { Alert, CircularProgress, Box, Typography, Card, CardMedia, CardContent, Chip, IconButton, useTheme, useMediaQuery, Button } from "@mui/material";
import { ArrowBackIos as ArrowBackIcon, ArrowForwardIos as ArrowForwardIcon, Favorite, Star, PlayArrow, CalendarToday } from "@mui/icons-material";
// import "./moviestyle.css";

interface Movie {
  _id: string;
  moviename: string;
  genre: string;
  language: string;
  rating: number;
  duration?: string;
  releaseDate?: string;
  poster?: string;
  votes?: number;
  likes?: number;
}

const MoviesHome: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAllMovies, setShowAllMovies] = useState(false);
  const router = useRouter();

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));

  const getItemsPerSlide = () => {
    if (isXs) return 3;
    if (isSm) return 5;
    if (isMd) return 5;
    if (isLg) return 5;
    return 5;
  };

  const itemsPerSlide = getItemsPerSlide();
  const carouselMovies = movies.slice(0, 10);
  const totalSlides = Math.ceil(carouselMovies.length / itemsPerSlide);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError(null);
        const moviesData = await getAllMovies();

        if (Array.isArray(moviesData) && moviesData.length > 0) {
          setMovies(moviesData);
        } else {
          setMovies([]);
          setError("No movies available in the database");
        }
      } catch (error: any) {
        console.error("Error in fetchMovies:", error);
        setError(error.message || "Failed to load movies. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const handleNextSlide = async () => {
    if (currentSlide < totalSlides - 1 && !isAnimating) {
      setIsAnimating(true);
      setCurrentSlide(prev => prev + 1);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const handlePrevSlide = async () => {
    if (currentSlide > 0 && !isAnimating) {
      setIsAnimating(true);
      setCurrentSlide(prev => prev - 1);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const handleMovieClick = (movieId: string) => {
    router.push(`/movies/${movieId}`);
  };

  const handleShowAll = () => {
    setShowAllMovies(true);
    setCurrentSlide(0);
  };

  const handleShowLess = () => {
    setShowAllMovies(false);
    setCurrentSlide(0);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjUwIiB5PSI0MCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMjAiIHJ4PSI4IiBmaWxsPSIjQkRDNUM5Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjYwIiByPSIyMCIgZmlsbD0iIzlBOUE5QSIvPgo8L3N2Zz4=';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getRandomPromoted = () => {
    return Math.random() > 0.7;
  };

  // Get current slide movies for carousel
  const getCurrentSlideMovies = () => {
    const startIndex = currentSlide * itemsPerSlide;
    return carouselMovies.slice(startIndex, startIndex + itemsPerSlide);
  };

  // Render movie card component
  const renderMovieCard = (movie: Movie) => (
    <Card
      key={movie._id}
      className="movie-card"
      onClick={() => handleMovieClick(movie._id)}
      sx={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '15px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 15px 30px rgba(0, 0, 0, 0.2)'
        }
      }}
    >
      {/* Promoted Badge - Fixed to show automatically without hover */}
      {getRandomPromoted() && (
        <Box className="promoted-badge" sx={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '10px',
          fontSize: '0.7rem',
          fontWeight: 700,
          fontFamily: '"Roboto", sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          zIndex: 2,
          boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)'
        }}>
          <Star className="promoted-star" sx={{ fontSize: '0.8rem' }} />
          TRENDING
        </Box>
      )}

      {/* Movie Poster */}
      <Box className="poster-container" sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '13px 13px 0 0',
        height: { xs: '200px', sm: '250px' }
      }}>
        <CardMedia
          component="img"
          className="movie-poster"
          image={movie.poster || ''}
          alt={movie.moviename}
          onError={handleImageError}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease'
          }}
        />
      </Box>

      <CardContent className="movie-content" sx={{
        padding: { xs: '12px', sm: '16px' }
      }}>
        {/* Movie Title */}
        <Typography className="movie-title" sx={{
          fontSize: { xs: '0.9rem', sm: '1rem' },
          fontWeight: 700,
          color: '#333',
          fontFamily: '"Roboto", sans-serif',
          lineHeight: 1.3,
          marginBottom: '8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          minHeight: '2.6em'
        }}>
          {movie.moviename}
        </Typography>

        {/* Movie Info */}
        <Box className="movie-meta" sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <Typography className="movie-language" sx={{
            fontSize: '0.8rem',
            color: '#666',
            fontWeight: 500
          }}>
            {movie.language}
          </Typography>
          <Typography className="movie-duration" sx={{
            fontSize: '0.8rem',
            color: '#667eea',
            fontWeight: 600
          }}>
            {movie.duration}
          </Typography>
        </Box>

        {/* Rating and Votes */}
        <Box className="rating-section" sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <Box className="rating-badge" sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(255, 193, 7, 0.1)',
            padding: '4px 8px',
            borderRadius: '10px'
          }}>
            <Star className="rating-star" sx={{ 
              fontSize: '0.9rem',
              color: '#ffc107'
            }} />
            <Typography className="rating-score" sx={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#ffc107'
            }}>
              {movie.rating || 0}/10
            </Typography>
          </Box>
          <Typography className="votes-count" sx={{
            fontSize: '0.75rem',
            color: '#888'
          }}>
            {formatNumber(movie.votes || 0)} votes
          </Typography>
        </Box>

        {/* Likes */}
        <Box className="likes-section" sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '10px'
        }}>
          <Favorite className="likes-heart" sx={{ 
            fontSize: '0.9rem',
            color: '#ff6b6b'
          }} />
          <Typography className="likes-count" sx={{
            fontSize: '0.8rem',
            color: '#ff6b6b',
            fontWeight: 600
          }}>
            {formatNumber(movie.likes || Math.floor(Math.random() * 50000) + 1000)} likes
          </Typography>
        </Box>

        {/* Genre Chips */}
        <Box className="genre-container" sx={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap'
        }}>
          {movie.genre?.split('/').slice(0, 2).map((genre, index) => (
            <Chip
              key={index}
              label={genre.trim()}
              className="genre-chip"
              size="small"
              sx={{
                fontSize: '0.7rem',
                background: 'rgba(102, 126, 234, 0.1)',
                color: '#667eea',
                border: '1px solid rgba(102, 126, 234, 0.3)',
                fontWeight: 500
              }}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );

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
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
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
      <Box className="movies-container" sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        background: 'linear-gradient(135deg, #ffffffff 0%, #ffffffff 100%)'
      }}>
        <Alert severity="error" sx={{ 
          borderRadius: 3, 
          maxWidth: 400, 
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          background: 'rgba(255, 255, 255, 0.95)',
          fontFamily: '"Roboto", sans-serif'
        }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (movies.length === 0) {
    return (
      <Box className="movies-container" sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        background: 'linear-gradient(135deg, #ffffffff 0%, #ffffffff 100%)'
      }}>
        <Alert severity="info" sx={{ 
          borderRadius: 3, 
          maxWidth: 400, 
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          background: 'rgba(255, 255, 255, 0.95)',
          fontFamily: '"Roboto", sans-serif'
        }}>
          No movies found. Please check back later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box className="movies-container" sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #c2c2c2ff 0%, #000000ff 100%)',
      padding: { xs: '20px 15px', sm: '30px 20px', md: '40px 30px', lg: '50px 40px' }
    }}>
      {/* Header - Left Aligned */}
      <Box className="movies-header" sx={{
        marginBottom: { xs: '30px', sm: '40px', md: '50px' }
      }}>
        <Box className="header-content" sx={{
          maxWidth: '500px'
        }}>
          <Typography className="movies-title" sx={{
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            fontWeight: 800,
            color: 'black',
            fontFamily: '"Roboto", sans-serif',
            marginBottom: '10px',
            // textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            Recommended Movies
          </Typography>
          <Typography className="movies-subtitle" sx={{
            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 300,
            fontFamily: '"Roboto", sans-serif',
            marginBottom: '20px'
          }}>
            Curated collection of trending movies
          </Typography>
          <Box className="header-decoration" sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Box className="decoration-line" sx={{
              height: '3px',
              width: '50px',
              background: 'linear-gradient(90deg, #ff6b6b, transparent)',
              borderRadius: '2px'
            }}></Box>
            <PlayArrow className="decoration-icon" sx={{
              fontSize: '2rem',
              color: '#ff6b6b',
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
            }} />
          </Box>
        </Box>
      </Box>

      {/* Show All/Show Less Button */}
      <Box className="toggle-button-container" sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '10px'
      }}>
        {showAllMovies ? (
          <Button
            onClick={handleShowLess}
            variant="contained"
            sx={{
              background: 'rgba(255, 255, 255, 0.9)',
              color: '#667eea',
              fontWeight: 600,
              padding: '10px 24px',
              borderRadius: '25px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'white',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)'
              }
            }}
          >
            Show Less
          </Button>
        ) : (
          <Button
            onClick={handleShowAll}
            variant="contained"
            sx={{
              background: 'rgba(255, 255, 255, 0.9)',
              color: '#667eea',
              fontWeight: 600,
              padding: '10px 24px',
              borderRadius: '25px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'white',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)'
              }
            }}
          >
            Show All
          </Button>
        )}
      </Box>

      {/* Carousel Container - Always shows 10 movies */}
      <Box className="carousel-container" sx={{
        position: 'relative',
        marginBottom: '40px'
      }}>
        {/* Navigation Arrows */}
        {totalSlides > 1 && (
          <>
            <IconButton
              onClick={handlePrevSlide}
              disabled={currentSlide === 0 || isAnimating}
              className={`nav-arrow left-arrow ${isAnimating ? 'animating' : ''}`}
              sx={{
                position: 'absolute',
                left: { xs: '-10px', sm: '-15px', md: '-20px' },
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                background: 'rgba(255, 255, 255, 0.9) !important',
                color: '#667eea',
                width: { xs: '40px', sm: '50px' },
                height: { xs: '40px', sm: '50px' },
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'white !important',
                  transform: 'translateY(-50%) scale(1.1)'
                },
                '&.Mui-disabled': {
                  background: 'rgba(255, 255, 255, 0.5) !important',
                  color: 'rgba(102, 126, 234, 0.5)'
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>

            <IconButton
              onClick={handleNextSlide}
              disabled={currentSlide === totalSlides - 1 || isAnimating}
              className={`nav-arrow right-arrow ${isAnimating ? 'animating' : ''}`}
              sx={{
                position: 'absolute',
                right: { xs: '-10px', sm: '-15px', md: '-20px' },
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                background: 'rgba(255, 255, 255, 0.9) !important',
                color: '#667eea',
                width: { xs: '40px', sm: '50px' },
                height: { xs: '40px', sm: '50px' },
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'white !important',
                  transform: 'translateY(-50%) scale(1.1)'
                },
                '&.Mui-disabled': {
                  background: 'rgba(255, 255, 255, 0.5) !important',
                  color: 'rgba(102, 126, 234, 0.5)'
                }
              }}
            >
              <ArrowForwardIcon />
            </IconButton>
          </>
        )}

        {/* Movies Carousel - Always shows 10 movies */}
        <Box className="carousel-track" sx={{
          overflow: 'hidden',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '20px'
        }}>
          <Box className={`carousel-slide ${isAnimating ? 'slide-transition' : ''}`} sx={{
            display: 'flex',
            gap: { xs: '15px', sm: '20px' },
            transition: 'transform 0.5s ease-in-out',
            transform: `translateX(-${currentSlide * (100 / itemsPerSlide)}%)` // Fixed transform calculation
          }}>
            {carouselMovies.map((movie, index) => (
              <Box
                key={movie._id}
                sx={{
                  flex: `0 0 calc(${100 / itemsPerSlide}% - ${20 - (20 / itemsPerSlide)}px)`,
                  minWidth: 0,
                  flexShrink: 0
                }}
              >
                {renderMovieCard(movie)}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Slide Indicators */}
        {totalSlides > 1 && (
          <Box className="slide-indicators" sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '20px'
          }}>
            {Array.from({ length: totalSlides }).map((_, index) => (
              <Box
                key={index}
                className={`slide-dot ${currentSlide === index ? 'active' : ''} ${isAnimating ? 'animating' : ''}`}
                onClick={() => !isAnimating && setCurrentSlide(index)}
                sx={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: currentSlide === index ? 'white' : 'rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: currentSlide === index ? 'white' : 'rgba(255, 255, 255, 0.5)',
                    transform: 'scale(1.2)'
                  }
                }}
              />
            ))}
          </Box>
        )}

        {/* Slide Counter */}
        {totalSlides > 1 && (
          <Typography className="slide-counter" sx={{
            textAlign: 'center',
            marginTop: '15px',
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: 500,
            fontFamily: '"Roboto", sans-serif'
          }}>
            {currentSlide + 1} / {totalSlides}
          </Typography>
        )}
      </Box>

      {/* All Movies - Shows when "Show All" is clicked */}
      {showAllMovies && (
        <Box className="all-movies-container" sx={{
          marginBottom: '40px'
        }}>
          <Typography className="all-movies-title" sx={{
            fontSize: { xs: '1.5rem', sm: '2rem' },
            fontWeight: 700,
            color: 'white',
            fontFamily: '"Roboto", sans-serif',
            marginBottom: '20px',
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            All Movies ({movies.length})
          </Typography>
          <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px',
            justifyContent: 'center'
          }}>
            {movies.map((movie) => (
              <Box 
                key={movie._id} 
                sx={{
                  width: { xs: 'calc(50% - 10px)', sm: 'calc(33.333% - 14px)', md: 'calc(25% - 15px)', lg: 'calc(20% - 16px)' }
                }}
              >
                {renderMovieCard(movie)}
              </Box>
            ))}
          </Box>
        </Box>
      )}

     
    </Box>
  );
};

export default MoviesHome;