"use client";
import React from "react";
import { Box, Button, Typography, Tooltip } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/hooks/hookes";
import { toggleSeat } from "@/store/bookingSlice";

interface SeatMatrixProps {
  rows: number;
  columns: number;
  bookedSeats: string[];
  lockedSeats?: string[];
  onSeatClick: (seatId: string) => void;
}

type SeatStatus = "available" | "booked" | "locked" | "selected";

const SeatButton: React.FC<{
  id: string;
  status: SeatStatus;
  onClick: () => void;
  rowLabel: string;
}> = ({ id, status, onClick, rowLabel }) => {
  const getSeatColor = (status: SeatStatus): string => {
    switch (status) {
      case "available":
        return "#22c55e"; // green
      case "booked":
        return "#ef4444"; // red
      case "locked":
        return "#f59e0b"; // amber
      case "selected":
        return "#3b82f6"; // blue
      default:
        return "#6b7280"; // gray
    }
  };

  const getSeatTooltip = (status: SeatStatus): string => {
    switch (status) {
      case "available":
        return "Available - Click to select";
      case "booked":
        return "Already booked";
      case "locked":
        return "Temporarily locked by another user";
      case "selected":
        return "Selected - Click to deselect";
      default:
        return "Unknown status";
    }
  };

  const isFirstSeat = id.endsWith("1");

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      {isFirstSeat && (
        <Typography
          sx={{
            width: 24,
            textAlign: "center",
            mr: 1,
            fontWeight: "bold",
            color: "white",
          }}
        >
          {rowLabel}
        </Typography>
      )}
      <Tooltip title={getSeatTooltip(status)} arrow>
        <Button
          sx={{
            minWidth: 36,
            minHeight: 36,
            maxWidth: 36,
            maxHeight: 36,
            borderRadius: 1,
            textTransform: "none",
            backgroundColor: getSeatColor(status),
            color: "white",
            fontWeight: "bold",
            fontSize: "0.75rem",
            "&:hover": {
              backgroundColor: getSeatColor(status),
              opacity: status === "available" || status === "selected" ? 0.8 : 1,
              transform: status === "available" || status === "selected" ? "scale(1.05)" : "none",
            },
            "&:disabled": {
              backgroundColor: getSeatColor(status),
              opacity: 0.6,
              color: "white",
              transform: "none",
            },
            margin: "2px",
            transition: "all 0.2s ease-in-out",
          }}
          onClick={onClick}
          disabled={status === "booked" || status === "locked"}
        >
          {id.split(rowLabel)[1]}
        </Button>
      </Tooltip>
    </Box>
  );
};

const SeatMatrix: React.FC<SeatMatrixProps> = ({
  rows,
  columns,
  bookedSeats,
  lockedSeats = [],
  onSeatClick,
}) => {
  const dispatch = useAppDispatch();
  const selectedSeats = useAppSelector((state) => state.booking.selectedSeats);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const handleSeatClick = (seatId: string) => {
    onSeatClick(seatId);
  };

  const getSeatStatus = (seatId: string): SeatStatus => {
    if (bookedSeats.includes(seatId)) return "booked";
    if (lockedSeats.includes(seatId)) return "locked";
    if (selectedSeats.includes(seatId)) return "selected";
    return "available";
  };

  // Create screen
  const screenWidth = Math.min(columns * 40, 600);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        p: 3,
      }}
    >
      {/* Screen */}
      <Box
        sx={{
          width: screenWidth,
          height: 20,
          backgroundColor: "#4f46e5",
          borderRadius: "4px 4px 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "0.75rem",
          fontWeight: "bold",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)",
          mb: 2,
        }}
      >
        SCREEN - THIS WAY
      </Box>

      {/* Seats Grid */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {Array.from({ length: rows }, (_, rowIndex) => {
          const rowLabel = alphabet[rowIndex] || `R${rowIndex + 1}`;
          return (
            <Box key={rowIndex} sx={{ display: "flex", gap: 0.5 }}>
              {Array.from({ length: columns }, (_, colIndex) => {
                const seatId = `${rowLabel}${colIndex + 1}`;
                const status = getSeatStatus(seatId);

                return (
                  <SeatButton
                    key={seatId}
                    id={seatId}
                    status={status}
                    onClick={() => handleSeatClick(seatId)}
                    rowLabel={rowLabel}
                  />
                );
              })}
            </Box>
          );
        })}
      </Box>

      {/* Legend */}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          flexWrap: "wrap",
          justifyContent: "center",
          mt: 2,
          p: 2,
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{ width: 20, height: 20, backgroundColor: "#22c55e", borderRadius: 1 }}
          />
          <Typography variant="body2" color="white">
            Available
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{ width: 20, height: 20, backgroundColor: "#3b82f6", borderRadius: 1 }}
          />
          <Typography variant="body2" color="white">
            Selected
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{ width: 20, height: 20, backgroundColor: "#f59e0b", borderRadius: 1 }}
          />
          <Typography variant="body2" color="white">
            Locked
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{ width: 20, height: 20, backgroundColor: "#ef4444", borderRadius: 1 }}
          />
          <Typography variant="body2" color="white">
            Booked
          </Typography>
        </Box>
      </Box>

      {/* Selection Summary */}
      {selectedSeats.length > 0 && (
        <Box
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            p: 3,
            borderRadius: 2,
            textAlign: "center",
            border: "1px solid rgba(59, 130, 246, 0.3)",
          }}
        >
          <Typography variant="h6" color="white" gutterBottom>
            Selected Seats
          </Typography>
          <Typography variant="body1" color="white" sx={{ mb: 1 }}>
            {selectedSeats.join(", ")}
          </Typography>
          <Typography variant="body2" color="#94a3b8">
            Total: {selectedSeats.length} seat{selectedSeats.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SeatMatrix;


