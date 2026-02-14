import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../utils/api';

function AdminPanel() {
    const [notificationMsg, setNotificationMsg] = useState('');
    const [sliderImages, setSliderImages] = useState([]);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [newImageTitle, setNewImageTitle] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const notifRes = await api.get('/api/admin/notification');
            setNotificationMsg(notifRes.data.message);

            const sliderRes = await api.get('/api/admin/slider-images');
            setSliderImages(sliderRes.data.images);
        } catch (err) {
            console.error('Failed to load admin settings');
        }
    };

    const handleUpdateNotification = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/admin/notification', { message: notificationMsg });
            setMessage('Notification updated!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Failed to update notification');
        }
    };

    const handleAddImage = async (e) => {
        e.preventDefault();
        const updatedImages = [...sliderImages, { url: newImageUrl, title: newImageTitle }];
        try {
            await api.post('/api/admin/slider-images', { images: updatedImages });
            setSliderImages(updatedImages);
            setNewImageUrl('');
            setNewImageTitle('');
            setMessage('Image added!');
        } catch (err) {
            setMessage('Failed to add image');
        }
    };

    const handleRemoveImage = async (index) => {
        const updatedImages = sliderImages.filter((_, i) => i !== index);
        try {
            await api.post('/api/admin/slider-images', { images: updatedImages });
            setSliderImages(updatedImages);
            setMessage('Image removed!');
        } catch (err) {
            setMessage('Failed to remove image');
        }
    };

    return (
        <>
            <Navbar />

            <div className="container" style={{ paddingTop: '120px', paddingBottom: '2rem' }}>
                <h1 style={{ color: 'var(--primary)', marginBottom: '2rem' }}>Admin Panel</h1>

                {message && (
                    <div style={{
                        padding: '1rem', marginBottom: '1rem', borderRadius: '8px',
                        background: message.includes('Failed') ? 'var(--error)' : 'var(--success)',
                        color: 'white'
                    }}>
                        {message}
                    </div>
                )}

                <div className="grid grid-2" style={{ gap: '2rem' }}>
                    {/* Notification Settings */}
                    <div className="glass-card">
                        <h3>Notification Banner</h3>
                        <form onSubmit={handleUpdateNotification} style={{ marginTop: '1rem' }}>
                            <div className="form-group">
                                <label>Banner Text</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={notificationMsg}
                                    onChange={(e) => setNotificationMsg(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-primary">Update Notification</button>
                        </form>
                    </div>

                    {/* Slider Settings */}
                    <div className="glass-card">
                        <h3>Add Slider Image</h3>
                        <form onSubmit={handleAddImage} style={{ marginTop: '1rem' }}>
                            <div className="form-group">
                                <label>Image URL</label>
                                <input
                                    type="url"
                                    className="input-field"
                                    placeholder="https://example.com/image.jpg"
                                    value={newImageUrl}
                                    onChange={(e) => setNewImageUrl(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Title / Caption</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Special Offer"
                                    value={newImageTitle}
                                    onChange={(e) => setNewImageTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-secondary">Add Image</button>
                        </form>
                    </div>
                </div>

                {/* Manage Images */}
                <div className="glass-card mt-4">
                    <h3>Manage Slider Images</h3>
                    <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {sliderImages.map((img, index) => (
                            <div key={index} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '16/9' }}>
                                <img src={img.url} alt={img.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0,
                                    background: 'rgba(0,0,0,0.7)', color: 'white', padding: '0.5rem',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '0.8rem', truncate: true }}>{img.title}</span>
                                    <button
                                        onClick={() => handleRemoveImage(index)}
                                        style={{ background: 'var(--error)', border: 'none', color: 'white', cursor: 'pointer', padding: '0.2rem 0.5rem', borderRadius: '4px' }}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

export default AdminPanel;
