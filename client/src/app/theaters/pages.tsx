"use client";
import React from "react";
import { Box, Container, Typography } from "@mui/material";

export default function TheatersRootPage() {
  return (
    <Box sx={{ minHeight: "60vh", pt: 6, pb: 6 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>Find Theaters</Typography>
        <Typography color="text.secondary">Select a movie first to view theaters showing that movie, or use search to find nearby theaters.</Typography>
        {/* You can add a search / map here later */}
      </Container>
    </Box>
  );
}
