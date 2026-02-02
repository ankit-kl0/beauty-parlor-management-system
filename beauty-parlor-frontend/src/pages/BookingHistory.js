import { useState, useEffect } from "react";
import { getMyBookings, cancelBooking, createFeedback } from "../services/api";
import "./BookingHistory.css";

function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [feedbackForms, setFeedbackForms] = useState({});
  const [submittingFeedbackId, setSubmittingFeedbackId] = useState(null);

  const getDatePart = (dateValue) => {
    if (!dateValue) return null;
    if (typeof dateValue === "string") {
      return dateValue.includes("T") ? dateValue.split("T")[0] : dateValue;
    }
    try {
      return new Date(dateValue).toISOString().split("T")[0];
    } catch (err) {
      console.error("Failed to parse date", err);
      return null;
    }
  };

  const getBookingDateTime = (dateValue, timeSlot) => {
    const datePart = getDatePart(dateValue);
    if (!datePart) return null;
    const normalizedTime = (timeSlot || "00:00:00").slice(0, 8);
    const candidate = new Date(`${datePart}T${normalizedTime}`);
    return Number.isNaN(candidate.getTime()) ? null : candidate;
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await getMyBookings();
      setBookings(response.data.data);
    } catch (err) {
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const confirmCancel = window.confirm("Are you sure you want to cancel this booking?");
    if (!confirmCancel) return;
    const reason = window.prompt("Please provide a reason for cancellation (optional):");

    try {
      await cancelBooking(bookingId, { cancellation_reason: reason || null });
      setMessage("Booking cancelled successfully.");
      fetchBookings();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel booking");
      setTimeout(() => setError(""), 5000);
    }
  };

  const canCancelBooking = (bookingDate, timeSlot, status) => {
    if (status === "CANCELLED" || status === "COMPLETED") return false;
    const bookingDateTime = getBookingDateTime(bookingDate, timeSlot);
    if (!bookingDateTime) return false;
    return bookingDateTime > new Date() && (status === "PENDING" || status === "CONFIRMED");
  };

  const handleFeedbackChange = (bookingId, field, value) => {
    setFeedbackForms((prev) => ({
      ...prev,
      [bookingId]: {
        rating: prev[bookingId]?.rating ?? 5,
        comment: prev[bookingId]?.comment ?? "",
        ...prev[bookingId],
        [field]: value
      }
    }));
  };

  const handleSubmitFeedback = async (booking) => {
    const form = feedbackForms[booking.id] || { rating: "", comment: "" };
    if (!form.rating) {
      setError("Please select a rating before submitting feedback.");
      setTimeout(() => setError(""), 4000);
      return;
    }

    setSubmittingFeedbackId(booking.id);
    try {
      await createFeedback({
        rating: Number(form.rating),
        comment: form.comment || undefined,
        booking_id: booking.id,
        service_id: booking.service_id
      });
      setMessage("Thank you for sharing your feedback!");
      setFeedbackForms((prev) => {
        const updated = { ...prev };
        delete updated[booking.id];
        return updated;
      });
      fetchBookings();
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit feedback");
      setTimeout(() => setError(""), 5000);
    } finally {
      setSubmittingFeedbackId(null);
    }
  };

  const renderStars = (rating = 0) => {
    const full = Math.round(Number(rating));
    return "★".repeat(full) + "☆".repeat(5 - full);
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'PENDING': 'status-pending',
      'CONFIRMED': 'status-confirmed',
      'CANCEL_REQUESTED': 'status-cancel-requested',
      'CANCELLED': 'status-cancelled',
      'COMPLETED': 'status-completed'
    };
    return statusMap[status] || 'status-pending';
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'PENDING': 'Pending Confirmation',
      'CONFIRMED': 'Confirmed',
      'CANCEL_REQUESTED': 'Cancellation Requested',
      'CANCELLED': 'Cancelled',
      'COMPLETED': 'Completed'
    };
    return statusMap[status] || status;
  };

  if (loading) return <div className="loading">Loading bookings...</div>;

  return (
    <div className="booking-history">
      <h1>My Bookings</h1>
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {bookings.length === 0 ? (
        <div className="no-bookings">You have no bookings yet.</div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => {
            const priceDisplay = booking.total_price
              ? Number(booking.total_price).toFixed(2)
              : booking.service_prices?.split(', ')[0];
            const durationDisplay = booking.total_duration
              ? `${booking.total_duration} minutes`
              : booking.service_durations
                ? `${booking.service_durations.split(', ')[0]} minutes`
                : null;
            const form = feedbackForms[booking.id] || { rating: 5, comment: "" };

            return (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <h3>{booking.service_names || "Beauty Service"}</h3>
                <span className={`status ${getStatusBadgeClass(booking.status)}`}>
                  {getStatusLabel(booking.status)}
                </span>
              </div>
              <div className="booking-details">
                <p><strong>Date:</strong> {new Date(booking.booking_date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {booking.time_slot.substring(0, 5)}</p>
                <p><strong>Price:</strong> Rs. {priceDisplay || "N/A"}</p>
                {durationDisplay && <p><strong>Duration:</strong> {durationDisplay}</p>}
                <p><strong>Services:</strong> {booking.service_names || "N/A"}</p>
                {booking.stylist_name && (
                  <p><strong>Assigned Stylist:</strong> {booking.stylist_name}</p>
                )}
                <p><strong>Booked on:</strong> {new Date(booking.created_at).toLocaleString()}</p>
                {booking.cancellation_reason && (
                  <p className="cancellation-reason"><strong>Cancellation Reason:</strong> {booking.cancellation_reason}</p>
                )}
              </div>
              {canCancelBooking(booking.booking_date, booking.time_slot, booking.status) && (
                <button
                  className="btn-cancel-request"
                  onClick={() => handleCancelBooking(booking.id)}
                >
                  Cancel Booking
                </button>
              )}
              {booking.feedback_id ? (
                <div className="feedback-summary">
                  <h4>Your Feedback</h4>
                  <div className="feedback-rating">
                    {renderStars(booking.feedback_rating)}
                    <span>({booking.feedback_rating}/5)</span>
                  </div>
                  <p>{booking.feedback_comment || "No comment provided."}</p>
                  <small>Submitted on {new Date(booking.feedback_created_at).toLocaleDateString()}</small>
                </div>
              ) : (
                booking.status === "COMPLETED" && (
                  <div className="feedback-form">
                    <h4>How was your experience?</h4>
                    <div className="feedback-inputs">
                      <label>
                        Rating
                        <select
                          value={form.rating}
                          onChange={(e) => handleFeedbackChange(booking.id, "rating", e.target.value)}
                        >
                          {[5, 4, 3, 2, 1].map((value) => (
                            <option key={value} value={value}>{value} Stars</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Comment (optional)
                        <textarea
                          value={form.comment}
                          onChange={(e) => handleFeedbackChange(booking.id, "comment", e.target.value)}
                          placeholder="Tell us what went well..."
                        />
                      </label>
                    </div>
                    <button
                      className="btn-feedback"
                      disabled={submittingFeedbackId === booking.id}
                      onClick={() => handleSubmitFeedback(booking)}
                    >
                      {submittingFeedbackId === booking.id ? "Submitting..." : "Submit Feedback"}
                    </button>
                  </div>
                )
              )}
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}

export default BookingHistory;

