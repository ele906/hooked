// -----------------------------------------------------------------------
// Navigate.jsx
// Navigation Modal for Hooked
// Authors: Lucille Rizo Patron, Eleanor Liu
// -----------------------------------------------------------------------

import React from 'react'
import {useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { cornerButtonStyle } from './styles'
import API_URL from './config'


// Renders the liked songs screen where users can view and manage their 
// liked songs list.
function Navigation() {

    // enables flow from one screen to another
    const navigate = useNavigate()

    // tracks whether the modal is open or not
    const [isOpen, setIsOpen] = useState(false)

    // store user id
    const { user } = useAuth() 
    const [userId, setUserId] = useState(null)

    // ------------------ Set Up Navigation ----------------------------

    const username = user?.username || sessionStorage.getItem('username') || ''

    const menu = [
        {name: 'Swipe', path: '/swipe', protected: true},
        {name: 'Liked Songs', path: '/liked', protected: true},
        {name: 'Song Search', path: '/search', protected: true},
        {
            name: 'Profile',
            path: `/profile/${username}`,
            protected: true
        },
        { name: 'Generate', path: '/generate', protected: true },
    ]

    const handleLogout = () => {
        window.location.href = `${API_URL}/logoutapp`
    }

    // -------------------- Render Page Navigation Modal --------------
    return (
        <div>
            {/* menu icon (hamburger) */}
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                style={cornerButtonStyle('top', 'left')}
            >
                {isOpen ? '✕' : '☰'}
            </button>

            {/* modal */}
            {isOpen && (
                <div className = "modal-screen-style">
                    <h1 style={{ color: '#debff7', marginBottom: '20px' }}>Hooked</h1>

                    {/* navigation buttons */}
                    {user && 
                        <>
                            {menu.map(item => (
                                <button 
                                    key={item.path} 
                                    className="nav-button" 
                                    onClick={() => {
                                        if (item.name === "Profile") {
                                            navigate(item.path, { state: { isOwnProfile: true } });
                                        } else {
                                            navigate(item.path);
                                        }
                                        setIsOpen(false)
                                    }}> {item.name}
                                </button>
                            ))}
                            <button className='nav-button' 
                                onClick={() => navigate(-1)}>
                                 ← Back
                            </button>
                            <button 
                                className="nav-button" 
                                onClick={handleLogout} 
                                style={{ marginTop: '20px', 
                                    border: '2px solid #6bfff8', 
                                    color: '#2dffed',
                                    backgroundColor: '#1d8b7d4f' }}>
                                Logout
                            </button>
                        </>
                    }
                </div>
            )}
        </div>
    )
}

export default Navigation;