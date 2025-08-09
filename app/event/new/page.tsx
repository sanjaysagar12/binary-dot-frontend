'use client';

import { useState } from 'react';

interface FormData {
  title: string;
  description: string;
  image: string;
  location: string;
  startDate: string;
  endDate: string;
  maxParticipants: string;
  prizePool: string;
  numberOfPrizes: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export default function CreateEventPage() {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    image: '',
    location: '',
    startDate: '',
    endDate: '',
    maxParticipants: '',
    prizePool: '',
    numberOfPrizes: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Get token from localStorage
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        alert('Please login to create an event');
        return;
      }

      // Prepare the data
      const submitData = {
        title: formData.title,
        description: formData.description,
        image: formData.image || undefined,
        location: formData.location || undefined,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        prizePool: formData.prizePool ? parseFloat(formData.prizePool) : undefined,
        numberOfPrizes: formData.numberOfPrizes ? parseInt(formData.numberOfPrizes) : undefined
      };

      const response = await fetch('http://localhost:3000/api/event/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        alert('Event created successfully!');
        // Clear form
        setFormData({
          title: '',
          description: '',
          image: '',
          location: '',
          startDate: '',
          endDate: '',
          maxParticipants: '',
          prizePool: '',
          numberOfPrizes: ''
        });
        // Optional: redirect to events list
        // window.location.href = '/events';
      } else {
        const errorData = await response.json();
        alert(`Error creating event: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
        Create New Event
      </h1>
      
      <form onSubmit={handleSubmit} style={{ backgroundColor: '#f9f9f9', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
            Event Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px',
              border: errors.title ? '2px solid #e74c3c' : '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="Enter event title"
          />
          {errors.title && <span style={{ color: '#e74c3c', fontSize: '14px' }}>{errors.title}</span>}
        </div>

        {/* Description */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            style={{
              width: '100%',
              padding: '10px',
              border: errors.description ? '2px solid #e74c3c' : '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              resize: 'vertical'
            }}
            placeholder="Describe your event"
          />
          {errors.description && <span style={{ color: '#e74c3c', fontSize: '14px' }}>{errors.description}</span>}
        </div>

        {/* Image URL */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
            Image URL (optional)
          </label>
          <input
            type="url"
            name="image"
            value={formData.image}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* Location */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
            Location (optional)
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="Event location"
          />
        </div>

        {/* Start Date */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
            Start Date & Time *
          </label>
          <input
            type="datetime-local"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px',
              border: errors.startDate ? '2px solid #e74c3c' : '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
          {errors.startDate && <span style={{ color: '#e74c3c', fontSize: '14px' }}>{errors.startDate}</span>}
        </div>

        {/* End Date */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
            End Date & Time *
          </label>
          <input
            type="datetime-local"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px',
              border: errors.endDate ? '2px solid #e74c3c' : '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
          {errors.endDate && <span style={{ color: '#e74c3c', fontSize: '14px' }}>{errors.endDate}</span>}
        </div>

        {/* Max Participants */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
            Max Participants (optional)
          </label>
          <input
            type="number"
            name="maxParticipants"
            value={formData.maxParticipants}
            onChange={handleChange}
            min="1"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="Maximum number of participants"
          />
        </div>

        {/* Prize Pool */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
            Prize Pool (optional)
          </label>
          <input
            type="number"
            name="prizePool"
            value={formData.prizePool}
            onChange={handleChange}
            min="0"
            step="0.01"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="Total prize amount"
          />
        </div>

        {/* Number of Prizes */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
            Number of Prizes (optional)
          </label>
          <input
            type="number"
            name="numberOfPrizes"
            value={formData.numberOfPrizes}
            onChange={handleChange}
            min="1"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="How many prizes to distribute"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isSubmitting ? '#95a5a6' : '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s'
          }}
        >
          {isSubmitting ? 'Creating Event...' : 'Create Event'}
        </button>
      </form>
    </div>
  );
}
