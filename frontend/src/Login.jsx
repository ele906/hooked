// -----------------------------------------------------------------------
// WelcomePage.jsx
// Swipe interface for Hooked (in progress)
// Authors: Eleanor Liu
// -----------------------------------------------------------------------

import React from 'react'
import {useCallback, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'

function Login(){

    // this makes it go from one screen to another
    const navigate = useNavigate()

    function handleLogin() {
        window.location.href = "http://localhost:5000/auth/login";
    }

    function handleBackButton() {
        console.log("back button clicked, go back to welcome page")
        navigate('/')
    }

    const handleKeyPress = useCallback((e) => {
        if (e.key === ' ' || e.code === "Space") {
            console.log('Space pressed')
            navigate('/swipe')
        }
    }, [navigate])

    useEffect(() => { 
        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [handleKeyPress])

    return (
        <div style={screenStyle}>
        Login to Account
        <button style={backButtonStyle} onClick={handleLogin}>
            Sign in with Google
        </button>
        <button style={backButtonStyle} onClick={handleBackButton}>
            Back
        </button>
        </div>
    );
}

// --------------------------------- Styles --------------------------------
const screenStyle = {
    minHeight: '100vh',
    backgroundColor: '#18171d',
    color: '#debff7',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    position: 'relative',
}

const backButtonStyle = {
    padding: '15px 35px',
    fontSize: '16px',
    backgroundColor: '#debff7',
    color: '#1d1133',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
}

export default Login