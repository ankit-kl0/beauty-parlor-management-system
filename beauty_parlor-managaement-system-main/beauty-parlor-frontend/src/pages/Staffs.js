import { useState, useEffect, useContext } from "react";
import { getStaff, createStaff, updateStaff, deleteStaff, setStaffWorkingHours } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import "./Staffs.css";

function Staffs() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const { user } = useContext(AuthContext);

  // Staff Management State
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    experience_years: ""
  });
  const [workingHours, setWorkingHours] = useState({
    monday: { start: "09:00", end: "18:00", is_available: true },
    tuesday: { start: "09:00", end: "18:00", is_available: true },
    wednesday: { start: "09:00", end: "18:00", is_available: true },
    thursday: { start: "09:00", end: "18:00", is_available: true },
    friday: { start: "09:00", end: "18:00", is_available: true },
    saturday: { start: "09:00", end: "18:00", is_available: true },
    sunday: { start: "09:00", end: "18:00", is_available: false }
  });

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchStaff();
    }
  }, [user]);

  const fetchStaff = async () => {
    try {
      const res = await getStaff();
      setStaff(res.data.data);
    } catch (err) {
      console.error("Failed to load staff", err);
    } finally {
      setLoading(false);
    }
  };

  // Staff Management Functions
  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      if (editingStaff) {
        await updateStaff(editingStaff.id, staffForm);
        setMessage("✅ Staff updated successfully");
      } else {
        await createStaff(staffForm);
        setMessage("✅ Staff added successfully");
      }

      setStaffForm({
        name: "",
        email: "",
        phone: "",
        specialization: "",
        experience_years: ""
      });
      setShowStaffForm(false);
      setEditingStaff(null);
      fetchStaff();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Staff operation failed", err);
      setMessage("❌ Failed to save staff");
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const handleEditStaff = (staffMember) => {
    setEditingStaff(staffMember);
    setStaffForm({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone,
      specialization: staffMember.specialization,
      experience_years: staffMember.experience_years
    });
    setShowStaffForm(true);
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) return;

    try {
      await deleteStaff(staffId);
      setMessage("✅ Staff deleted successfully");
      fetchStaff();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Delete failed", err);
      setMessage("❌ Failed to delete staff");
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const handleSetWorkingHours = async (staffId) => {
    try {
      const hoursData = Object.entries(workingHours).map(([day, hours]) => ({
        day_of_week: day,
        start_time: hours.start,
        end_time: hours.end,
        is_available: hours.is_available
      }));

      await setStaffWorkingHours(staffId, { working_hours: hoursData });
      setMessage("✅ Working hours updated successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Working hours update failed", err);
      setMessage("❌ Failed to update working hours");
      setTimeout(() => setMessage(""), 4000);
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="staffs-page">
        <div className="access-denied">
          <h1>Access Denied</h1>
          <p>You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading">Loading staff...</div>;

  return (
    <div className="staffs-page">
      <div className="staffs-header">
        <h1>Staff Management</h1>
        <p>Manage your beauty parlor staff members</p>
      </div>

      {/* MESSAGE */}
      {message && (
        <div className={`admin-message ${message.includes("❌") ? "error" : "success"}`}>
          {message}
        </div>
      )}

      {/* ADD STAFF BUTTON */}
      <div className="staffs-header">
        <button
          className="btn-primary"
          onClick={() => {
            setShowStaffForm(!showStaffForm);
            setEditingStaff(null);
            if (!showStaffForm) {
              setStaffForm({
                name: "",
                email: "",
                phone: "",
                specialization: "",
                experience_years: ""
              });
            }
          }}
        >
          {showStaffForm ? "Cancel" : "+ Add Staff"}
        </button>
      </div>

      {/* STAFF FORM */}
      {showStaffForm && (
        <div className="staff-form-container">
          <form onSubmit={handleStaffSubmit} className="staff-form">
            <h3>{editingStaff ? "Edit Staff" : "Add New Staff"}</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={staffForm.name}
                  onChange={e => setStaffForm({...staffForm, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={staffForm.email}
                  onChange={e => setStaffForm({...staffForm, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={staffForm.phone}
                  onChange={e => setStaffForm({...staffForm, phone: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Specialization</label>
                <input
                  type="text"
                  value={staffForm.specialization}
                  onChange={e => setStaffForm({...staffForm, specialization: e.target.value})}
                  placeholder="e.g., Hair Stylist, Makeup Artist"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Experience (years)</label>
                <input
                  type="number"
                  min="0"
                  value={staffForm.experience_years}
                  onChange={e => setStaffForm({...staffForm, experience_years: e.target.value})}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingStaff ? "Update Staff" : "Add Staff"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowStaffForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STAFF TABLE */}
      <div className="staff-table-container">
        <table className="staff-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Specialization</th>
              <th>Experience</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(member => (
              <tr key={member.id}>
                <td><strong>{member.name}</strong></td>
                <td>{member.email}</td>
                <td>{member.phone || "-"}</td>
                <td>{member.specialization || "-"}</td>
                <td>{member.experience_years ? `${member.experience_years} years` : "-"}</td>
                <td>
                  <span className={`status-badge ${member.is_active ? "status-confirmed" : "status-cancelled"}`}>
                    {member.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-action btn-blue"
                      onClick={() => handleEditStaff(member)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-action btn-red"
                      onClick={() => handleDeleteStaff(member.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {staff.length === 0 && (
          <div className="no-staff">No staff members found</div>
        )}
      </div>
    </div>
  );
}

export default Staffs;