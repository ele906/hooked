// -----------------------------------------------------------------------
// WelcomePage.jsx
// Swipe interface for Hooked (in progress)
// Authors: Eleanor Liu, Lucille Rizo Patron
// -----------------------------------------------------------------------

import React from 'react'
import {useCallback, useEffect, useState} from 'react'
import { useNavigate} from 'react-router-dom'
import API_URL from './config'
import { getScreenStyle, cornerButtonStyle} from './styles'
import './index.css'

//circles
import Circle from "./AnimatedCircle.jsx"
import musicNote1 from './musical-note-1.png'
import musicNote2 from './musical-note-2.png'

function SignUp(){

    const navigate = useNavigate() // this makes it go from one screen to another
    const [email, setEmail] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")

    async function handleSignUp() {
        if (password.length < 8) {
            setError("Password must be at least 8 characters")
            return
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        const res = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email, 
                username, 
                password,
                user_image_url: ''
            })
        })
        const data = await res.json()

        if (res.ok) {
            alert("Account created! Please check your email to verify before logging in.")
            navigate('/login')
        } else {
            setError(data.error || 'Signup failed')
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
        <div style = {{...getScreenStyle(
            'rgba(170, 109, 217, 0.4)',
            'rgba(230, 167, 255, 0.64)',
            'rgba(186, 151, 225, 0.4)',
            'rgba(154, 177, 255, 0.69)'),
            color: '#debff7'}}>

        <div className = 'welcome-card-style'> 

            <div className = 'login-header-style'> 
                Create an Account
            </div>

            <button style={{...cornerButtonStyle('top', 'left')}} onClick = { () => {
                console.log("back button clicked! lets migrate to welcome page")
                navigate('/')
            }}> 
                ⬅ 
            </button>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className='input-login'
                    style={{ width: '100%', maxWidth: '300px' }}
                />

                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className='input-login'
                    style={{ width: '100%', maxWidth: '300px' }}
                />

                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className='input-login'
                    style={{ width: '100%', maxWidth: '300px' }}
                />

                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className='input-login'
                    style={{ width: '100%', maxWidth: '300px' }}
                />

                {error && <p style={{ color: '#ff6b6b', fontSize: '13px', margin: 0, textAlign: 'center' }}>{error}</p>}

                <button
                    className = "login-button"
                    onClick={handleSignUp}
                    onMouseEnter={(e) => { e.target.style.backgroundColor = '#cdbfea' }}
                    onMouseLeave={(e) => { e.target.style.backgroundColor = '#debff7' }}
                >
                    Create Account
                </button>
            </div>
        </div>

        <Circle image={musicNote1} alpha={0.008}/>            
        <Circle image={musicNote1} alpha={0.008}/>    
        <Circle image={musicNote1} alpha={0.008}/>    
        <Circle image={musicNote2} alpha={0.008}/>    
        <Circle image={musicNote2} alpha={0.008}/>    
        <Circle image={musicNote2} alpha={0.008}/>
        </div>
    )
}


// --------------------------------- EXPORT --------------------------------

export default SignUp