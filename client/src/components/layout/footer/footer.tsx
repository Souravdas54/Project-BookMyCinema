"use client";

import { Box, Container, Typography, Link as MuiLink, Button, Divider, } from '@mui/material';
import Link from 'next/link';
import LocalMoviesIcon from "@mui/icons-material/LocalMovies";

export default function Footer() {
  const quickLinks = [
    { label: 'Movies', href: '/movies' },
    { label: 'Theaters', href: '/theaters' },
    { label: 'Events', href: '/events' },
    { label: 'Sports', href: '/sports' },
  ];

  const supportLinks = [
    { label: 'Contact Us', href: '/contact' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'grey.900',
        color: 'white',
        mt: 'auto',
        py: 8,
      }}
    >
      <Container maxWidth="xl">
        {/* Footer Content */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 4, md: 6, lg: 8 },
            mb: 4,
          }}
        >
          {/* Brand Section */}
          <Box sx={{ flex: { md: 2, lg: 3 } }}>
            <Box sx={{ display: 'flex' }}>
              <LocalMoviesIcon
                sx={{
                  color: "#ff3f6c",
                  fontSize: { xs: "24px", sm: "28px", md: "32px" },

                }}
              />
              <Typography variant="h6" fontWeight={700} gutterBottom sx={{ml:1}}>
                BookMycinema
              </Typography>
            </Box>


            <Typography
              variant="body2"
              color="grey.400"
              sx={{
                lineHeight: 1.6,
                maxWidth: 300,
                mb: 2
              }}
            >
              Your ultimate destination for movie tickets and entertainment experiences.
            </Typography>
          </Box>

          {/* Quick Links and Support - Side by side on desktop */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 4, sm: 6, lg: 8 },
              flex: { md: 2, lg: 2 }
            }}
          >
            {/* Quick Links */}
            <Box sx={{ minWidth: 120 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Quick Links
              </Typography>
              <Box
                component="nav"
                sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
              >
                {quickLinks.map((link) => (
                  <MuiLink
                    key={link.label}
                    component={Link}
                    href={link.href}
                    color="grey.400"
                    sx={{
                      textDecoration: 'none',
                      '&:hover': { color: 'white' },
                      transition: 'color 0.3s ease',
                    }}
                  >
                    {link.label}
                  </MuiLink>
                ))}
              </Box>
            </Box>

            {/* Support */}
            <Box sx={{ minWidth: 120 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Support
              </Typography>
              <Box
                component="nav"
                sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
              >
                {supportLinks.map((link) => (
                  <MuiLink
                    key={link.label}
                    component={Link}
                    href={link.href}
                    color="grey.400"
                    sx={{
                      textDecoration: 'none',
                      '&:hover': { color: 'white' },
                      transition: 'color 0.3s ease',
                    }}
                  >
                    {link.label}
                  </MuiLink>
                ))}
              </Box>
            </Box>
          </Box>

          {/* Download App */}
          <Box sx={{ flex: { md: 1, lg: 1 } }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Download App
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                maxWidth: 200
              }}
            >
              <Button
                variant="contained"
                color="inherit"
                sx={{
                  backgroundColor: 'black',
                  color: 'white',
                  '&:hover': { backgroundColor: 'grey.800' },
                }}
              >
                Google Play
              </Button>
              <Button
                variant="contained"
                color="inherit"
                sx={{
                  backgroundColor: 'black',
                  color: 'white',
                  '&:hover': { backgroundColor: 'grey.800' },
                }}
              >
                App Store
              </Button>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 4, backgroundColor: 'grey.700' }} />

        <Typography
          variant="body2"
          color="grey.400"
          align="center"
        >
          &copy; 2024 BookMycinema Pro. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}