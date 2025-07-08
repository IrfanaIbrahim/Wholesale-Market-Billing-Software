import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/ViewVegetables.css';

const ViewVegetables = () => {
    const navigate = useNavigate();
    const [vegetables, setVegetables] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchVegetables = async () => {
            try {
                const res = await axios.get('http://localhost:5000/getVegetables');
                setVegetables(res.data);
            } catch (err) {
                console.error(err);
                setError('❌ Failed to fetch vegetables.');
            }
        };

        fetchVegetables();
    }, []);

    return (
        <div className="view-veg-container">
            <div className="top-bar">
                <button className="nav-btn left" onClick={() => navigate('/')}>🏠 Home</button>
                <button className="nav-btn right" onClick={() => navigate('/addVegetable')}>➕ Add Vegetable</button>
            </div>

            <div className="veg-list">
                <h2>Vegetable List</h2>
                {error && <p className="error-message">{error}</p>}
                {vegetables.length === 0 && !error ? (
                    <p>No vegetables found.</p>
                ) : (
                    <ul>
                        {vegetables.map((veg) => (
                            <li key={veg.id}>
                                ID: {veg.id} - {veg.name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ViewVegetables;
