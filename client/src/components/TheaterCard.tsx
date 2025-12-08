"use client";

import { Show } from "@/types/booking";
import { Theater } from "@/types/theater";

type TheaterWithShows = Theater & { shows?: Show[] };

interface TheaterCardProps {
  theater: TheaterWithShows;
  calculateAvailableSeats: (show: Show) => number;
  formatShowTime: (time: string) => string;
  onViewDetails: (theaterId: string) => void;
  onBookShow: (showId: string) => void;
}

export default function TheaterCard({
  theater,
  calculateAvailableSeats,
  formatShowTime,
  onViewDetails,
  onBookShow,
}: TheaterCardProps) {

  const shows = theater.shows || [];

  return (
    <div style={{
      border: "1px solid #ddd",
      padding: "15px",
      margin: "10px 0",
      borderRadius: "10px"
    }}>
      <h3>{theater.theatername}</h3>
      <p>Screens : {theater.screens}</p>

      {shows.length === 0 ? (
        <p style={{ color: "red" }}>No shows available</p>
      ) : (
        shows.map((show) => (
          <div key={show._id} style={{ marginTop: "10px" }}>
            <p>Room: {show.room.name}</p>
            <p>Date: {show.date}</p>

            <p>
              Time:
              {show.showTime.map((time) => (
                <span key={time} style={{ marginRight: "8px" }}>
                  {formatShowTime(time)}
                </span>
              ))}
            </p>

            <p>Available Seats: {calculateAvailableSeats(show)}</p>
            <p>Price: ₹{show.price}</p>

            <button
              onClick={() => onBookShow(show._id)}
              style={{
                background: "green",
                color: "#fff",
                padding: "6px 12px",
                borderRadius: "5px"
              }}
            >
              Book Now
            </button>
          </div>
        ))
      )}

      <button
        onClick={() => onViewDetails(theater._id)}
        style={{
          marginTop: "10px",
          background: "#555",
          color: "#fff",
          padding: "6px 12px",
          borderRadius: "5px"
        }}
      >
        View Details
      </button>
    </div>
  );
}
