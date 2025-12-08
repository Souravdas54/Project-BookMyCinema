// // lib/theme.ts
// 'use client';
// import { createTheme } from '@mui/material/styles';

// const theme = createTheme({
//     palette: {
//         primary: {
//             main: '#1976d2',
//             dark: '#115293',
//             light: '#42a5f5',
//         },
//         secondary: {
//             main: '#dc004e',
//         },
//         background: {
//             default: '#f5f5f5',
//             paper: '#ffffff',
//         },
//         text: {
//             primary: '#1a1a1a',
//             secondary: '#666666',
//         },
//     },
//     typography: {
//         fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
//         h1: {
//             fontSize: '2.5rem',
//             fontWeight: 800,
//             '@media (min-width:600px)': {
//                 fontSize: '3rem',
//             },
//         },
//         h2: {
//             fontSize: '2rem',
//             fontWeight: 700,
//         },
//         h3: {
//             fontSize: '1.5rem',
//             fontWeight: 600,
//         },
//         h4: {
//             fontSize: '1.25rem',
//             fontWeight: 600,
//         },
//         body1: {
//             fontSize: '1rem',
//             lineHeight: 1.6,
//         },
//         body2: {
//             fontSize: '0.875rem',
//             lineHeight: 1.5,
//         },
//     },
//     breakpoints: {
//         values: {
//             xs: 0,
//             sm: 600,
//             md: 900,
//             lg: 1200,
//             xl: 1536,
//         },
//     },
//     components: {
//         MuiCard: {
//             styleOverrides: {
//                 root: {
//                     borderRadius: 12,
//                     boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
//                     transition: 'all 0.3s ease',
//                     '&:hover': {
//                         transform: 'translateY(-4px)',
//                         boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
//                     },
//                 },
//             },
//         },
//         MuiButton: {
//             styleOverrides: {
//                 root: {
//                     borderRadius: 8,
//                     textTransform: 'none',
//                     fontWeight: 600,
//                 },
//             },
//         },
//     },
// });

// export default theme;