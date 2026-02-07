import { useEffect, useState } from "react";
import { createFeedback, getMyFeedback, getServices } from "../services/api";
import "./FeedbackPage.css";

function FeedbackPage() {
  const [services, setServices] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [form, setForm] = useState({ rating: 5, comment: "", service_id: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [servicesRes, feedbackRes] = await Promise.all([
        getServices(),
        getMyFeedback()
      ]);
      setServices(servicesRes.data.data || []);
      setFeedbackList(feedbackRes.data.data || []);
    } catch (err) {
      setError("Failed to load feedback data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.rating) {
      setError("Please select a rating.");
      return;
    }

    const payload = {
      rating: Number(form.rating),
      comment: form.comment || undefined
    };
    if (form.service_id) {
      payload.service_id = Number(form.service_id);
    }

    try {
      setSubmitting(true);
      await createFeedback(payload);
      setMessage("Thank you for your feedback!");
      setForm({ rating: 5, comment: "", service_id: "" });
      const feedbackRes = await getMyFeedback();
      setFeedbackList(feedbackRes.data.data || []);
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit feedback");
      setTimeout(() => setError(""), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating = 0) => {
    const full = Math.round(Number(rating));
    return "★".repeat(full) + "☆".repeat(5 - full);
  };

  if (loading) return <div className="loading">Loading feedback...</div>;

  return (
    <div className="feedback-page">
      <div className="feedback-header">
        <h1>Share Your Feedback</h1>
        <p>Your feedback helps us improve our services.</p>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="feedback-contact-grid">
        <div className="feedback-form-card">
          <h2>Submit Feedback</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label>
                Service (optional)
                <select
                  value={form.service_id}
                  onChange={(e) => handleChange("service_id", e.target.value)}
                >
                  <option value="">General Feedback</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-row">
              <label>
                Rating
                <select
                  value={form.rating}
                  onChange={(e) => handleChange("rating", e.target.value)}
                  required
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} Stars
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-row">
              <label>
                Comment (optional)
                <textarea
                  value={form.comment}
                  onChange={(e) => handleChange("comment", e.target.value)}
                  placeholder="Tell us about your experience..."
                  rows={4}
                />
              </label>
            </div>

            <button className="btn-feedback-submit" type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        </div>

        <div className="contact-section">
          <h2>Contact Us</h2>
          <p>We’re here to help. Reach out with any questions or concerns.</p>
          <div className="contact-grid">
            <div className="contact-card">
              <h4>Address</h4>
              <p>Battisputali, Kathmandu</p>
              <a
                href="https://maps.google.com/?q=Battisputali%2C%20Kathmandu"
                target="_blank"
                rel="noreferrer"
                className="contact-link"
              >
                View on Google Maps
              </a>
            </div>
            <div className="contact-card">
              <h4>Phone</h4>
              <p>+977 9841234234</p>
            </div>
            <div className="contact-card">
              <h4>Email</h4>
              <p>support@sujitabeautyparlour.com</p>
              <p className="contact-muted">We reply within 24 hours</p>
            </div>
            <div className="contact-card">
              <h4>Business Hours</h4>
              <p>Sun–Fri: 9:00 AM – 7:00 PM</p>
              <p>Saturday: 10:00 AM – 5:00 PM</p>
            </div>
          </div>
        </div>
      </div>

      <div className="feedback-history">
        <h2>My Feedback</h2>
        {feedbackList.length === 0 ? (
          <div className="no-feedback">You haven't submitted feedback yet.</div>
        ) : (
          <div className="feedback-list">
            {feedbackList.map((item) => (
              <div className="feedback-item" key={item.id}>
                <div className="feedback-item-header">
                  <h4>{item.service_name || "General"}</h4>
                  <span className="feedback-rating">{renderStars(item.rating)} ({item.rating}/5)</span>
                </div>
                <p className="feedback-comment">{item.comment || "No comment provided."}</p>
                <small>Submitted on {new Date(item.created_at).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default FeedbackPage;
