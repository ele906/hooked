// -----------------------------------------------------------------------
// WelcomePage.jsx
// Swipe interface for Hooked (in progress)
// Authors: Eleanor Liu
// Contributors:  Lucille Rizo Patron
// -----------------------------------------------------------------------

import React, { useState } from 'react'
import {useCallback, useEffect} from 'react'
import { useNavigate} from 'react-router-dom'
import API_URL from './config'

function SignUp(){

    // this makes it go from one screen to another
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    const handleSignup = async () => {
        setError("")
        if (password.length < 8) {
            setError("Password must be at least 8 characters")
            return
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        const res = await fetch(`${API_URL}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, username, password })
        })
        const data = await res.json()
        if (res.ok) {
            alert("Account created! Please check your email to verify before logging in.")
            navigate('/login')
        } else {
            setError(data.error || "Signup failed")
        }
    }

    const handleKeyPress = useCallback((e) => {
        if (e.key === ' ' || e.code === "Space") {
            console.log('Space pressed')
            navigate('/seedprefs')
        }
    }, [navigate])

    useEffect(() => { 
        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [handleKeyPress])

    return(
        <div style = {screenStyle}> 
            Create an Account <br />
            {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}

            <input style={backButtonStyle} type="email" placeholder="Email"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            <input style={backButtonStyle} type="text" placeholder="Username"
                value={username} onChange={(e) => setUsername(e.target.value)} />
            <input style={backButtonStyle} type={showPassword ? "text" : "password"} placeholder="Password"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            <input style={backButtonStyle} type={showPassword ? "text" : "password"} placeholder="Confirm Password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            <button style={backButtonStyle} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "Hide Password" : "Show Password"}
            </button>
            
            <button style={backButtonStyle} onClick = { () => {
                console.log("back button clicked! lets migrate to welcome page")
                navigate('/')
            }}> 
                Back 
            </button>

            <button style={backButtonStyle} onClick={handleSignup}>
                Sign Up
            </button>

        </div>
    )
}


// --------------------------------- Styles --------------------------------
const screenStyle = {
    minHeight: '100vh',
    backgroundColor: '#18171d',
    backgroundImage: `
        radial-gradient(circle at 20% 30%, rgba(213, 127, 217, 0.4) 0%, transparent 30%),
        radial-gradient(circle at 80% 20%, rgba(109, 166, 215, 0.25) 0%, transparent 30%),
        radial-gradient(circle at 85% 85%, rgba(148, 123, 176, 0.4) 0%, transparent 30%),
        radial-gradient(circle at 15% 90%, rgba(108, 148, 201, 0.3) 0%, transparent 30%)
    `,
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

export default SignUp