"use client";

import React, { useState, useEffect } from "react";
import {
    AppBar, Toolbar, Typography, IconButton, Box, Button, Avatar, Menu, MenuItem, Divider, TextField,
    InputAdornment, useMediaQuery, useTheme, Drawer
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LocalMoviesIcon from "@mui/icons-material/LocalMovies";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import LoginModal from "@/app/auth/signin/page";
import SignupModal from "@/app/auth/signup/page";
import Sidebar from "../sidebar/page";
import { UserType } from "@/types/usertype";
import { Theater } from "@/types/theater";
import { fetchNearbyTheaters } from "@/app/api/location.endpoint";

import './navbarstyle.css';
import { useRouter } from "next/navigation";

export default function Navbar() {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [locationAnchorEl, setLocationAnchorEl] = useState<null | HTMLElement>(null);
    const [districtAnchorEl, setDistrictAnchorEl] = useState<null | HTMLElement>(null);
    const [openSearchDrawer, setOpenSearchDrawer] = useState(false);
    const openMenu = Boolean(anchorEl);
    const openLocationMenu = Boolean(locationAnchorEl);
    const openDistrictMenu = Boolean(districtAnchorEl);

    const [openSignin, setOpenSignin] = useState(false);
    const [openSignup, setOpenSignup] = useState(false);

    const [user, setUser] = useState<UserType | null>(() => {
        if (typeof window !== "undefined") {
            const storedUser = sessionStorage.getItem("userData");
            return storedUser ? JSON.parse(storedUser) : null;
        }
        return null;
    });

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [theaters, setTheaters] = useState<Theater[]>([]);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [selectedDistrict, setSelectedDistrict] = useState<string>("");

    const isLogin = !!user;

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const router = useRouter();

    const districts = [
        "Kolkata",
        "Howrah",
        "Hooghly",
        "North 24 Parganas",
        "South 24 Parganas",
        "Bardhaman",
        "Siliguri",
        "Durgapur"
    ];

    useEffect(() => {
        const loadDistrict = () => {
            if (typeof window !== "undefined") {
                const urlParams = new URLSearchParams(window.location.search);
                const districtFromUrl = urlParams.get('district');
                const districtFromStorage = sessionStorage.getItem('selectedDistrict');

                let districtToSet = "";

                if (districtFromUrl) {
                    districtToSet = districtFromUrl;
                    console.log('Loaded district from URL:', districtFromUrl);

                    if (districtFromUrl !== districtFromStorage) {
                        sessionStorage.setItem('selectedDistrict', districtFromUrl);
                    }
                } else if (districtFromStorage) {
                    districtToSet = districtFromStorage;
                    console.log('Loaded district from sessionStorage:', districtFromStorage);

                    const url = new URL(window.location.href);
                    url.searchParams.set('district', districtFromStorage);
                    window.history.replaceState({}, '', url.toString());
                }

                if (districtToSet && districtToSet !== selectedDistrict) {
                    setSelectedDistrict(districtToSet);
                }
            }
        };

        loadDistrict();

        const handleUrlChange = () => {
            loadDistrict();
        };

        window.addEventListener('popstate', handleUrlChange);

        return () => {
            window.removeEventListener('popstate', handleUrlChange);
        };
    }, []);

    // Handle district selection and update URL
    const handleDistrictSelect = (district: string) => {
        setSelectedDistrict(district);
        setDistrictAnchorEl(null);

        if (district) {
            sessionStorage.setItem('selectedDistrict', district);
        } else {
            sessionStorage.removeItem('selectedDistrict');
        }

        // Update URL with district parameter
        const url = new URL(window.location.href);
        if (district) {
            url.searchParams.set('district', district);
        } else {
            url.searchParams.delete('district');
        }
        window.history.pushState({}, '', url.toString());

        // Trigger custom event for theater page to listen to
        const districtChangedEvent = new CustomEvent('districtChanged', {
            detail: district
        });
        window.dispatchEvent(districtChangedEvent);

        console.log('District selected:', district); // Debug log
    };

    const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleDistrictClick = (event: React.MouseEvent<HTMLElement>) => {
        setDistrictAnchorEl(event.currentTarget);
    };

    // const handleLocationClick = async (event: React.MouseEvent<HTMLElement>) => {
    //     setLocationAnchorEl(event.currentTarget);
    //     setLoadingLocation(true);

    //     if (!navigator.geolocation) {
    //         alert("Geolocation not supported");
    //         setLoadingLocation(false);
    //         return;
    //     }

    //     navigator.geolocation.getCurrentPosition(async (pos) => {
    //         const { latitude, longitude } = pos.coords;
    //         try {
    //             const res = await fetchNearbyTheaters(latitude, longitude);
    //             setTheaters(res.data || []);
    //         } catch (error: unknown) {
    //             console.error("Location error:", error);
    //             if (error instanceof Error) {
    //                 alert(error.message);
    //             }
    //         } finally {
    //             setLoadingLocation(false);
    //         }
    //     }, (error: GeolocationPositionError) => {
    //         console.error("Geolocation error:", error);
    //         setLoadingLocation(false);
    //         alert("Failed to get location");
    //     });
    // };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLocationClose = () => {
        setLocationAnchorEl(null);
    };

    const handleDistrictClose = () => {
        setDistrictAnchorEl(null);
    };

    const handleLocationSelect = (location: string) => {
        handleLocationClose();
    };


    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Search query:", searchQuery);
        if (isMobile) {
            handleSearchClose();
        }
    };

    const handleLogout = () => {
        sessionStorage.clear();
        localStorage.clear();
        
        router.push('/movies')
        window.location.reload();

        // setTimeout(() => {
        //     window.location.reload();
        // }, 100);
    };

    const handleSearchClick = () => {
        setOpenSearchDrawer(true);
    };

    const handleSearchClose = () => {
        setOpenSearchDrawer(false);
    };

    const handleSidebarOpen = () => {
        setSidebarOpen(true);
    };

    const handleSidebarClose = () => {
        setSidebarOpen(false);
    };

    return (
        <Box>
            <AppBar
                position="sticky"
                sx={{
                    backgroundColor: "#1a1a1a",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    backgroundImage: "none"
                }}
            >
                <Toolbar
                    sx={{
                        minHeight: { xs: "56px", sm: "64px" },
                        padding: { xs: "0 12px", sm: "0 16px", md: "0 24px" }
                    }}
                >
                    {/* LOGO */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: { xs: "8px", sm: "12px" },
                            marginRight: { xs: "auto", md: "32px" }
                        }}
                    >
                        <LocalMoviesIcon
                            sx={{
                                color: "#ff3f6c",
                                fontSize: { xs: "24px", sm: "28px", md: "32px" }
                            }}
                        />
                        <Typography
                            variant="h6"
                            sx={{
                                color: "white",
                                fontWeight: "bold",
                                fontSize: { xs: "1rem", sm: "1.25rem", md: "1.5rem" },
                                display: { xs: "none", sm: "block" }
                            }}
                        >
                            BookMyCinema
                        </Typography>
                    </Box>

                    {/* SEARCH AND LOCATION - Desktop */}
                    {!isMobile && (
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: "16px",
                                flex: 1,
                                maxWidth: "600px"
                            }}
                        >
                            {/* Search Bar */}
                            <TextField
                                placeholder="Search for movies, cinemas..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                sx={{
                                    flex: 1,
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: "white",
                                        borderRadius: "8px",
                                        '& fieldset': {
                                            borderColor: "transparent",
                                        },
                                        '&:hover fieldset': {
                                            borderColor: "#ff3f6c",
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: "#ff3f6c",
                                            borderWidth: "2px"
                                        },
                                    },
                                    '& .MuiInputBase-input': {
                                        padding: "12px 14px",
                                        fontSize: "0.875rem"
                                    }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: "#666" }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            {/* District Dropdown */}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    position: "relative"
                                }}
                            >
                                <Button
                                    onClick={handleDistrictClick}
                                    endIcon={<ExpandMoreIcon />}
                                    sx={{
                                        color: "white",
                                        textTransform: "none",
                                        fontSize: "0.875rem",
                                        fontWeight: 500,
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        '&:hover': {
                                            backgroundColor: "rgba(255,255,255,0.1)"
                                        }
                                    }}
                                >
                                    <LocationOnIcon sx={{ fontSize: "18px", marginRight: "6px" }} />
                                    {selectedDistrict || "Select District"}
                                </Button>

                                <Menu
                                    anchorEl={districtAnchorEl}
                                    open={openDistrictMenu}
                                    onClose={handleDistrictClose}
                                    sx={{
                                        '& .MuiPaper-root': {
                                            backgroundColor: "white",
                                            borderRadius: "8px",
                                            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                                            marginTop: "4px",
                                            minWidth: "200px"
                                        }
                                    }}
                                >
                                    <MenuItem
                                        onClick={() => handleDistrictSelect("")}
                                        sx={{
                                            fontSize: "0.875rem",
                                            fontWeight: selectedDistrict === "" ? 600 : 400,
                                            color: selectedDistrict === "" ? "#ff3f6c" : "inherit",
                                            backgroundColor: selectedDistrict === "" ? "rgba(255, 63, 108, 0.08)" : "transparent"
                                        }}
                                    >
                                        All Districts
                                    </MenuItem>
                                    <Divider />
                                    {districts.map((district) => (
                                        <MenuItem
                                            key={district}
                                            onClick={() => handleDistrictSelect(district)}
                                            sx={{
                                                fontSize: "0.875rem",
                                                fontWeight: selectedDistrict === district ? 600 : 400,
                                                color: selectedDistrict === district ? "#ff3f6c" : "inherit",
                                                backgroundColor: selectedDistrict === district ? "rgba(255, 63, 108, 0.08)" : "transparent"
                                            }}
                                        >
                                            {district}
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </Box>
                        </Box>
                    )}

                    {/* RIGHT SIDE BUTTONS */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: { xs: "4px", sm: "8px", md: "12px" },
                            marginLeft: "auto"
                        }}
                    >
                        {/* Mobile Search Icon */}
                        {isMobile && (
                            <IconButton
                                onClick={handleSearchClick}
                                sx={{
                                    color: "white",
                                    padding: { xs: "6px", sm: "8px" }
                                }}
                            >
                                <SearchIcon sx={{ fontSize: { xs: "20px", sm: "22px" } }} />
                            </IconButton>
                        )}

                        {/* Mobile District Selector */}
                        {isMobile && (
                            <IconButton
                                onClick={handleDistrictClick}
                                sx={{
                                    color: "white",
                                    padding: { xs: "6px", sm: "8px" }
                                }}
                            >
                                <LocationOnIcon sx={{ fontSize: { xs: "20px", sm: "22px" } }} />
                            </IconButton>
                        )}

                        {/* Signup Button */}
                        {!isLogin && !isSmallMobile && (
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => setOpenSignup(true)}
                                sx={{
                                    backgroundColor: "#ff3f6c",
                                    color: "white",
                                    fontWeight: "bold",
                                    fontSize: "0.75rem",
                                    padding: { xs: "6px 12px", sm: "8px 16px" },
                                    borderRadius: "6px",
                                    textTransform: "none",
                                    '&:hover': {
                                        backgroundColor: "#e0355a"
                                    }
                                }}
                            >
                                Signup
                            </Button>
                        )}

                        {/* Avatar */}
                        <IconButton
                            onClick={handleAvatarClick}
                            sx={{
                                padding: { xs: "4px", sm: "6px", md: "8px" }
                            }}
                        >
                            <Avatar
                                src={
                                    user?.profilePicture
                                        ? user.profilePicture
                                        : "/default-avatar.png"
                                }
                                sx={{
                                    width: { xs: "28px", sm: "32px", md: "36px" },
                                    height: { xs: "28px", sm: "32px", md: "36px" }
                                }}
                            />
                        </IconButton>

                        {/* Menu Button */}
                        <IconButton
                            onClick={handleSidebarOpen}
                            sx={{
                                color: "white",
                                padding: { xs: "6px", sm: "8px" }
                            }}
                        >
                            <MenuIcon sx={{ fontSize: { xs: "20px", sm: "22px", md: "24px" } }} />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Sidebar */}
            <Sidebar
                open={sidebarOpen}
                onClose={handleSidebarClose}
                onLoginClick={() => {
                    handleSidebarClose();
                    setOpenSignin(true);
                }}
                onSignupClick={() => {
                    handleSidebarClose();
                    setOpenSignup(true);
                }}
                user={user}
            />

            {/* Mobile Search Drawer */}
            <Drawer
                anchor="top"
                open={openSearchDrawer}
                onClose={handleSearchClose}
                sx={{
                    '& .MuiDrawer-paper': {
                        backgroundColor: "white",
                        padding: "16px"
                    }
                }}
            >
                <Box>
                    <form onSubmit={handleSearchSubmit}>
                        <TextField
                            autoFocus
                            placeholder="Search for movies, cinemas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            sx={{
                                width: "100%",
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: "8px",
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleSearchClose}>
                                            <CloseIcon />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </form>
                </Box>
            </Drawer>

            {/* Avatar Dropdown Menu */}
            <Menu
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleMenuClose}
                sx={{
                    '& .MuiPaper-root': {
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                        marginTop: "4px",
                        minWidth: "160px"
                    }
                }}
            >
                {isLogin && (
                    <MenuItem
                        sx={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "#333"
                        }}
                    >
                        {user?.name || "User"}
                    </MenuItem>
                )}

                {/* {isLogin && (
                    <MenuItem
                        onClick={() => { }}
                        sx={{ fontSize: "0.875rem" }}
                        
                    >
                             Dashboard
                     
                    </MenuItem>
                )} */}

                {!isLogin && (
                    <MenuItem
                        onClick={() => {
                            setOpenSignin(true);
                            handleMenuClose();
                        }}
                        sx={{ fontSize: "0.875rem" }}
                    >
                        Login
                    </MenuItem>
                )}

                {isLogin && <Divider />}

                {isLogin && (
                    <MenuItem
                        onClick={handleLogout}
                        sx={{
                            fontSize: "0.875rem",
                            color: "#ff3f6c",
                            fontWeight: 500
                        }}
                    >
                        Logout
                    </MenuItem>
                )}
            </Menu>

            {/* Location Menu for Mobile */}
            <Menu
                anchorEl={locationAnchorEl}
                open={openLocationMenu}
                onClose={handleLocationClose}
                sx={{
                    '& .MuiPaper-root': {
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                        marginTop: "4px"
                    }
                }}
            >
                {loadingLocation && (
                    <MenuItem sx={{ fontSize: "0.875rem" }}>
                        Detecting nearby theaters...
                    </MenuItem>
                )}

                {!loadingLocation && theaters.length === 0 && (
                    <MenuItem sx={{ fontSize: "0.875rem" }}>
                        No nearby theaters found
                    </MenuItem>
                )}

                {theaters.map((theater) => (
                    <MenuItem
                        key={theater._id}
                        onClick={() => handleLocationSelect(theater.theatername)}
                        sx={{ fontSize: "0.875rem" }}
                    >
                        <strong>{theater.theatername}</strong> - {theater.district}
                    </MenuItem>
                ))}
            </Menu>

            {/* District Menu for Mobile */}
            <Menu
                anchorEl={districtAnchorEl}
                open={openDistrictMenu}
                onClose={handleDistrictClose}
                sx={{
                    '& .MuiPaper-root': {
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                        marginTop: "4px",
                        minWidth: "180px"
                    }
                }}
            >
                <MenuItem
                    onClick={() => handleDistrictSelect("")}
                    sx={{
                        fontSize: "0.875rem",
                        fontWeight: selectedDistrict === "" ? 600 : 400,
                        color: selectedDistrict === "" ? "#ff3f6c" : "inherit"
                    }}
                >
                    All Districts
                </MenuItem>
                <Divider />
                {districts.map((district) => (
                    <MenuItem
                        key={district}
                        onClick={() => handleDistrictSelect(district)}
                        sx={{
                            fontSize: "0.875rem",
                            fontWeight: selectedDistrict === district ? 600 : 400,
                            color: selectedDistrict === district ? "#ff3f6c" : "inherit"
                        }}
                    >
                        {district}
                    </MenuItem>
                ))}
            </Menu>

            {/* Popup Windows */}
            <LoginModal
                open={openSignin}
                onClose={() => setOpenSignin(false)}
                onSwitchToSignup={() => {
                    setOpenSignin(false);
                    setOpenSignup(true);
                }}
                onLoginSuccess={(userData: UserType) => setUser(userData)}
            />

            <SignupModal
                open={openSignup}
                onClose={() => setOpenSignup(false)}
                onSwitchToLogin={() => {
                    setOpenSignup(false);
                    setOpenSignin(true);
                }}
            />
        </Box>
    );
}