import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getServices, createService, updateService, deleteService } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import ServiceCard from "../components/ServiceCard";
import Hero from "../components/Hero";
import "./Services.css";

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Admin Service Management State
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    price_npr: "",
    duration: "",
    category: "General",
    image_url: ""
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await getServices();
      setServices(response.data.data);
    } catch (err) {
      setError("Failed to load services");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Service Management Functions (Admin Only)
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      // Clear URL input when file is selected
      setServiceForm({...serviceForm, image_url: ""});
    }
  };

  const handleImageUrlChange = (url) => {
    setServiceForm({...serviceForm, image_url: url});
    setSelectedImage(null);
    setImagePreview(url || null);
  };
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const formData = new FormData();
      formData.append('name', serviceForm.name);
      formData.append('description', serviceForm.description);
      formData.append('price_npr', serviceForm.price_npr);
      formData.append('duration', serviceForm.duration);
      formData.append('category', serviceForm.category);
      
      // Add image file if selected, otherwise add URL
      if (selectedImage) {
        formData.append('image', selectedImage);
        // Don't append image_url when uploading a file
      } else if (serviceForm.image_url) {
        formData.append('image_url', serviceForm.image_url);
      }

      const serviceData = {
        name: serviceForm.name,
        description: serviceForm.description,
        price_npr: parseFloat(serviceForm.price_npr),
        duration: parseInt(serviceForm.duration),
        category: serviceForm.category,
        image_url: serviceForm.image_url
      };

      let response;
      if (editingService) {
        if (selectedImage) {
          // Use FormData for file upload
          response = await fetch(`http://localhost:5001/api/services/${editingService.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });
        } else {
          // Use JSON for URL update
          response = await updateService(editingService.id, serviceData);
        }
        setMessage("✅ Service updated successfully");
      } else {
        if (selectedImage) {
          // Use FormData for file upload
          response = await fetch('http://localhost:5001/api/services', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });
        } else {
          // Use JSON for URL
          response = await createService(serviceData);
        }
        setMessage("✅ Service added successfully");
      }

      // Handle response
      let result;
      if (selectedImage) {
        result = await response.json();
        if (!response.ok) {
          console.error('Upload failed:', result);
          throw new Error(result.message || 'Upload failed');
        }
      } else {
        result = response;
      }

      setServiceForm({
        name: "",
        description: "",
        price_npr: "",
        duration: "",
        category: "General",
        image_url: ""
      });
      setSelectedImage(null);
      setImagePreview(null);
      setShowServiceForm(false);
      setEditingService(null);
      fetchServices();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Service operation failed", err);
      setMessage("❌ Failed to save service");
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description || "",
      price_npr: service.price_npr.toString(),
      duration: service.duration.toString(),
      category: service.category || "General",
      image_url: service.image_url || ""
    });
    setSelectedImage(null);
    setImagePreview(service.image_url || null);
    setShowServiceForm(true);
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;

    try {
      await deleteService(serviceId);
      setMessage("✅ Service deleted successfully");
      fetchServices();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Delete failed", err);
      setMessage("❌ Failed to delete service");
      setTimeout(() => setMessage(""), 4000);
    }
  };

  if (loading) return <div className="loading">Loading services...</div>;
  if (error) return <div className="error">{error}</div>;

  // Admin View - Service Management
  if (user && user.role === "admin") {
    return (
      <div className="admin-services-page">
        <div className="services-header">
          <h1>Service Management</h1>
          <p>Manage your beauty parlor services</p>
        </div>

        {/* MESSAGE */}
        {message && (
          <div className={`admin-message ${message.includes("❌") ? "error" : "success"}`}>
            {message}
          </div>
        )}

        {/* ADD SERVICE BUTTON */}
        <div className="services-header">
          <button
            className="btn-primary"
            onClick={() => {
              setShowServiceForm(!showServiceForm);
              setEditingService(null);
              if (!showServiceForm) {
                setServiceForm({
                  name: "",
                  description: "",
                  price_npr: "",
                  duration: "",
                  category: "General",
                  image_url: ""
                });
                setSelectedImage(null);
                setImagePreview(null);
              }
            }}
          >
            {showServiceForm ? "Cancel" : "+ Add Service"}
          </button>
        </div>

        {/* SERVICE FORM */}
        {showServiceForm && (
          <div className="service-form-container">
            <form onSubmit={handleServiceSubmit} className="service-form">
              <h3>{editingService ? "Edit Service" : "Add New Service"}</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Service Name *</label>
                  <input
                    type="text"
                    value={serviceForm.name}
                    onChange={e => setServiceForm({...serviceForm, name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={serviceForm.category}
                    onChange={e => setServiceForm({...serviceForm, category: e.target.value})}
                  >
                    <option value="General">General</option>
                    <option value="Hair">Hair</option>
                    <option value="Skin">Skin</option>
                    <option value="Nails">Nails</option>
                    <option value="Makeup">Makeup</option>
                    <option value="Spa">Spa</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (NPR) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={serviceForm.price_npr}
                    onChange={e => setServiceForm({...serviceForm, price_npr: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Duration (minutes) *</label>
                  <input
                    type="number"
                    min="1"
                    value={serviceForm.duration}
                    onChange={e => setServiceForm({...serviceForm, duration: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={serviceForm.description}
                  onChange={e => setServiceForm({...serviceForm, description: e.target.value})}
                  rows="3"
                  placeholder="Describe the service..."
                />
              </div>

              <div className="form-group">
                <label>Service Image</label>
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="image-preview">
                    <img 
                      src={imagePreview.startsWith('data:') ? imagePreview : `http://localhost:5001${imagePreview}`} 
                      alt="Service preview" 
                      style={{maxWidth: '200px', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px'}} 
                    />
                  </div>
                )}

                {/* File Upload */}
                <div className="image-upload-section">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{marginBottom: '10px'}}
                  />
                  <small style={{color: '#666', display: 'block', marginBottom: '10px'}}>
                    Or enter image URL below:
                  </small>
                </div>

                {/* URL Input */}
                <input
                  type="url"
                  value={serviceForm.image_url}
                  onChange={e => handleImageUrlChange(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  disabled={selectedImage !== null}
                />
                {selectedImage && (
                  <small style={{color: '#4caf50', display: 'block', marginTop: '5px'}}>
                    ✓ File selected: {selectedImage.name}
                  </small>
                )}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingService ? "Update Service" : "Add Service"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowServiceForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SERVICES TABLE */}
        <div className="services-table-container">
          <table className="services-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map(service => (
                <tr key={service.id}>
                  <td>
                    {service.image_url ? (
                      <img
                        src={service.image_url.startsWith('/uploads/') 
                          ? `http://localhost:5001${service.image_url}` 
                          : service.image_url}
                        alt={service.name}
                        className="service-image-preview"
                      />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </td>
                  <td><strong>{service.name}</strong></td>
                  <td>{service.category || "General"}</td>
                  <td>Rs. {service.price_npr}</td>
                  <td>{service.duration} min</td>
                  <td>
                    <div className="description-text">
                      {service.description || "No description"}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-action btn-blue"
                        onClick={() => handleEditService(service)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-action btn-red"
                        onClick={() => handleDeleteService(service.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {services.length === 0 && (
            <div className="no-services">No services found</div>
          )}
        </div>
      </div>
    );
  }

  // Regular User View - Service Display
  return (
    <>
      <Hero />
      <div className="services-page" id="services">
        <div className="services-header">
          <h1>Our Premium Services</h1>
          <p>Indulge in luxury and choose a service to book your appointment</p>
          <div className="bulk-booking-section">
            <button
              className="btn-bulk-book"
              onClick={() => {
                const token = localStorage.getItem("token");
                if (token) {
                  navigate("/user/bulk-book");
                } else {
                  navigate("/login?redirect=/user/bulk-book");
                }
              }}
            >
              Bulk Booking - Book Multiple Services
            </button>
          </div>
        </div>
        <div className="services-grid">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onBook={() => {
                const token = localStorage.getItem("token");
                if (token) {
                  navigate(`/user/book/${service.id}`);
                } else {
                  navigate(`/login?redirect=/user/book/${service.id}`);
                }
              }}
            />
          ))}
        </div>
        {services.length === 0 && (
          <div className="no-services">No services available at the moment.</div>
        )}
      </div>
    </>
  );
}

export default Services;
