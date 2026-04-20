// -----------------------------------------------------------------------
// WelcomePage.jsx
// Swipe interface for Hooked (in progress)
// Authors: Eleanor Liu
// -----------------------------------------------------------------------

import {useCallback, useEffect, useState} from 'react'
import { useNavigate } from 'react-router-dom'
import API_URL from './config'

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



    function handleLogin() {
        window.location.href = `${API_URL}/auth/login`;
    }

    function handleBackButton() {
        console.log("back button clicked, go back to welcome page")
        navigate('/')
    }

    async function handleDone(myUsername, myPassword){
        const result = await fetch(`${API_URL}/api/checkpw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: myUsername, password: myPassword })
        })
        const data = await result.json()

        if (data.logged_in) {
            sessionStorage.setItem('username', data.username)
            sessionStorage.setItem('accesstoken', data.accesstoken)
            sessionStorage.setItem('refreshtoken', data.refreshtoken)
            if (!data.email_verified) {
                alert("Heads up: your email isn't verified yet. Check your inbox or use 'Resend verification email'.")
            }
            navigate('/swipe')
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
        <div style={screenStyle}>
        <h1>Login to Account</h1>

        <button style={buttonStyle} onClick={handleBackButton}>
            Back
        </button>

        <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            style={loginStyle}
        />

        <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={loginStyle}
        />
        <button style={buttonStyle} onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "Hide Password" : "Show Password"}
        </button>

        <button style={buttonStyle} onClick={() => handleDone(username, password)}>
            Done
        </button>
        <button style={buttonStyle} onClick={() => navigate('/forgot-password')}>
            Forgot password?
        </button>
        <button style={buttonStyle} onClick={() => navigate('/forgot-username')}>
    Forgot username?
</button>

        <button style={buttonStyle} onClick={handleResend}>
            Resend verification email
        </button>
        {resendMsg && <p>{resendMsg}</p>}



        <h2> Devs: Press space bar to bypass and go to swipe screen... </h2>

        </div>
    );
}

// --------------------------------- Styles --------------------------------
const screenStyle = {
    minHeight: '100vh',
    backgroundColor: '#18171d',
    backgroundImage: `
        radial-gradient(circle at 20% 30%, rgba(178, 201, 221, 0.4) 0%, transparent 30%),
        radial-gradient(circle at 80% 20%, rgba(214, 163, 226, 0.25) 0%, transparent 30%),
        radial-gradient(circle at 85% 85%, rgba(167, 202, 224, 0.4) 0%, transparent 30%),
        radial-gradient(circle at 15% 90%, rgba(190, 126, 194, 0.3) 0%, transparent 30%)
    `,
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#debff7',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    position: 'relative',
}

const buttonStyle = {
    padding: '15px 35px',
    fontSize: '16px',
    backgroundColor: '#debff7',
    color: '#1d1133',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
}

const loginStyle = {
    padding: '5px', 
    borderRadius: '3px',
    width: '300px',
    fontSize: '16px',
    backgroundColor: '#d9bfea',
    color: '#1d1133',
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
}


export default Login