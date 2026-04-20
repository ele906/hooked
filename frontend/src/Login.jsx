// -----------------------------------------------------------------------
// Login.jsx
// Login interface for Hooked (in progress)
// Authors: Eleanor Liu, Lucille Rizo Patron
// -----------------------------------------------------------------------

import {useCallback, useEffect, useState} from 'react'
import { useNavigate } from 'react-router-dom'
import API_URL from './config'
import { getScreenStyle } from './styles'
import './index.css'
import Circle from "./AnimatedCircle.jsx"
import musicNote1 from './musical-note-1.png'
import musicNote2 from './musical-note-2.png'
import { useAuth } from './AuthContext'

const secondaryButtonStyle = {
    backgroundColor: 'transparent',
    color: '#debff7',
    padding: '8px 16px',
    border: '1px solid #debff7',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '12px',
    marginBottom: '8px',
    fontSize: '14px',
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    width: '100%',
    maxWidth: '300px',
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto'
}

const primaryButtonStyle = {
    backgroundColor: '#debff7',
    color: '#1d1133',
    padding: '12px 32px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '16px',
    marginBottom: '8px',
    fontSize: '16px',
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 'bold',
    width: '100%',
    maxWidth: '300px',
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto',
    transition: 'all 0.3s ease'
}

function Login(){

    // this makes it go from one screen to another
    const navigate = useNavigate()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [resendMsg, setResendMsg] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    const handleResend = async () => {
        const email = window.prompt("Enter the email you signed up with:")
        if (!email) return
        const res = await fetch(`${API_URL}/auth/resend-verification`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        })
        const data = await res.json().catch(() => ({}))
        if (data.status === "already_verified") {
            setResendMsg("Your email has already been verified.")
        } else {
            setResendMsg("If that email exists, a verification link was sent.")
        }
    }



    const { fetchUser } = useAuth()

    const handleBackButton = () => {
        navigate('/')
    }

    async function handleDone(myUsername, myPassword){
        const result = await fetch(`${API_URL}/api/checkpw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: myUsername, password: myPassword })
        })
        console.log("status:", result.status) 
        const data = await result.json()
        console.log("data:", data)  

        if (!data){
            alert('Wrong username or password!')
        }
        if (data.logged_in) {
            sessionStorage.setItem('username', data.username)
            sessionStorage.setItem('accesstoken', data.accesstoken)
            sessionStorage.setItem('refreshtoken', data.refreshtoken)
            await fetchUser()
            if (!data.email_verified) {
                alert("Heads up: your email isn't verified yet. Check your inbox or use 'Resend verification email'.")
            }
            navigate(data.has_preferences ? '/swipe' : '/seedprefs')
        } else {
            alert(data.error || 'Wrong username or password!')
        }
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
        <div style = {{...getScreenStyle(
            'rgba(170, 109, 217, 0.4)',
            'rgba(153, 195, 230, 0.562)',
            'rgba(186, 151, 225, 0.4)',
            'rgba(164, 189, 218, 0.688)'),
            color: '#debff7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh'
        }}>

        <div className = 'card' style={{ width: 'min(90vw, 420px)', height: 'auto' }}> 

            <div className = 'card-header'> 
                <button className='back-btn' onClick={handleBackButton} style={{ position: 'absolute', left: '12px' }}>
                    ⬅
                </button>
                <h2 style={{ flex: 1, textAlign: 'center' }}>Login</h2>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className='input-box-1'
                    style={{ width: '100%', maxWidth: '300px' }}
                />

                <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className='input-box-1'
                    style={{ width: '100%', maxWidth: '300px' }}
                />

                <button 
                    style={{...secondaryButtonStyle}}
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(222, 191, 247, 0.2)' }}
                    onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }}
                >
                    {showPassword ? "Hide Password" : "Show Password"}
                </button>

                <button 
                    style={{...primaryButtonStyle}}
                    onClick={() => handleDone(username, password)}
                    onMouseEnter={(e) => { e.target.style.backgroundColor = '#cdbfea' }}
                    onMouseLeave={(e) => { e.target.style.backgroundColor = '#debff7' }}
                >
                    Login
                </button>

                <div style={{ borderTop: '1px solid #debff730', width: '100%', margin: '12px 0' }} />

                <button 
                    style={{...secondaryButtonStyle}}
                    onClick={() => navigate('/forgot-password')}
                    onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(222, 191, 247, 0.2)' }}
                    onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }}
                >
                    Forgot Password?
                </button>

                <button 
                    style={{...secondaryButtonStyle}}
                    onClick={() => navigate('/forgot-username')}
                    onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(222, 191, 247, 0.2)' }}
                    onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }}
                >
                    Forgot Username?
                </button>

                <button 
                    style={{...secondaryButtonStyle}}
                    onClick={handleResend}
                    onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(222, 191, 247, 0.2)' }}
                    onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }}
                >
                    Resend Verification Email
                </button>

                {resendMsg && <p style={{ color: '#a9d5ff', fontSize: '13px', marginTop: '8px' }}>{resendMsg}</p>}

            </div>
        </div>
            <Circle image={musicNote1} alpha={0.008}/>            
            <Circle image={musicNote1} alpha={0.008}/>    
            <Circle image={musicNote1} alpha={0.008}/>    
            <Circle image={musicNote2} alpha={0.008}/>    
            <Circle image={musicNote2} alpha={0.008}/>    
            <Circle image={musicNote2} alpha={0.008}/>
        </div>
    );
}

// -------------------- EXPORT --------------------
export default Login