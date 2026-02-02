import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getServices, getAvailability, createBooking } from "../services/api";
import "./BulkBookingForm.css";

function BulkBookingForm() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function fetchServices() {
    try {
      const response = await getServices();
      setServices(response.data.data);
    } catch (err) {
      setError("Failed to load services");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchAvailability = useCallback(async () => {
    try {
      if (selectedServices.length === 0 || !selectedDate) return;

      // For bulk booking, we need to find time slots that are available for ALL selected services
      const allSlots = new Set();

      for (const service of selectedServices) {
        const response = await getAvailability(service.service_id, selectedDate);
        const serviceSlots = response.data.data.map(slot => slot.time_slot);

        if (allSlots.size === 0) {
          // First service - add all its slots
          serviceSlots.forEach(slot => allSlots.add(slot));
        } else {
          // Subsequent services - keep only slots that are available for all services
          const commonSlots = new Set();
          serviceSlots.forEach(slot => {
            if (allSlots.has(slot)) {
              commonSlots.add(slot);
            }
          });
          allSlots.clear();
          commonSlots.forEach(slot => allSlots.add(slot));
        }
      }

      setAvailableSlots(Array.from(allSlots).map(slot => ({ time_slot: slot })));
      setSelectedTime("");
    } catch (err) {
      setError("Failed to load available time slots");
      console.error("Availability error:", err);
    }
  }, [selectedServices, selectedDate]);

  useEffect(() => {
    if (selectedDate && selectedServices.length > 0) {
      fetchAvailability();
    }
  }, [selectedDate, selectedServices, fetchAvailability]);

  const removeService = (serviceToRemove) => {
    setSelectedServices(prev => prev.filter(s => s.service_id !== serviceToRemove.service_id));
    setSelectedTime(""); // Reset time when services change
  };

  const handleServiceToggle = (service) => {
    setSelectedServices(prev => {
      const isSelected = prev.find(s => s.service_id === service.id);
      if (isSelected) {
        return prev.filter(s => s.service_id !== service.id);
      } else {
        return [...prev, { ...service, service_id: service.id }];
      }
    });
    setSelectedTime(""); // Reset time when services change
  };

  const calculateTotal = () => {
    const totalPrice = selectedServices.reduce((sum, service) => sum + parseFloat(service.price_npr), 0);
    const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration, 0);
    return { totalPrice, totalDuration };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedServices.length === 0) {
      setError("Please select at least one service");
      return;
    }

    if (!selectedDate || !selectedTime) {
      setError("Please select both date and time");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await createBooking({
        services: selectedServices.map(s => ({ service_id: s.service_id })),
        booking_date: selectedDate,
        time_slot: selectedTime
      });
      setSuccess("Bulk booking confirmed successfully!");
      setTimeout(() => {
        navigate("/user/bookings");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Get maximum date (30 days from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split("T")[0];
  };

  if (loading) return <div className="loading">Loading services...</div>;

  const { totalPrice, totalDuration } = calculateTotal();

  return (
    <div className="bulk-booking-container">
      <div className="bulk-booking-card">
        <h2>Bulk Booking - Select Multiple Services</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Service Selection */}
          <div className="form-group">
            <label>Select Services:</label>
            <div className="services-grid">
              {services.map(service => (
                <div
                  key={service.id}
                  className={`service-item ${selectedServices.find(s => s.service_id === service.id) ? 'selected' : ''}`}
                  onClick={() => handleServiceToggle(service)}
                >
                  <h4>{service.name}</h4>
                  <p className="service-price">Rs. {parseFloat(service.price_npr).toLocaleString()}</p>
                  <p>{service.duration} minutes</p>
                  {service.description && <p className="service-desc">{service.description}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Selected Services Summary */}
          {selectedServices.length > 0 && (
            <div className="selected-services-summary">
              <h3>Selected Services ({selectedServices.length})</h3>
              <div className="selected-services-list">
                {selectedServices.map(service => (
                  <div key={service.service_id} className="selected-service-item">
                    <span>{service.name}</span>
                    <span className="service-price">Rs. {parseFloat(service.price_npr).toLocaleString()}</span>
                    <span>{service.duration}min</span>
                    <button
                      type="button"
                      onClick={() => removeService(service)}
                      className="remove-service"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="total-summary">
                <p><strong>Total Price:</strong> <span className="total-price">Rs. {totalPrice.toLocaleString()}</span></p>
                <p><strong>Total Duration:</strong> {totalDuration} minutes</p>
              </div>
            </div>
          )}

          {/* Date Selection */}
          <div className="form-group">
            <label htmlFor="date">Select Date:</label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getMinDate()}
              max={getMaxDate()}
              required
            />
          </div>

          {/* Time Selection */}
          {selectedDate && selectedServices.length > 0 && (
            <div className="form-group">
              <label htmlFor="time">Select Time Slot:</label>
              <select
                id="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                required
              >
                <option value="">Choose a time slot</option>
                {availableSlots.map(slot => (
                  <option key={slot.time_slot} value={slot.time_slot}>
                    {slot.time_slot}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || selectedServices.length === 0}
            className="submit-btn"
          >
            {submitting ? "Creating Booking..." : `Book ${selectedServices.length} Service${selectedServices.length !== 1 ? 's' : ''}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default BulkBookingForm;