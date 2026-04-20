// -----------------------------------------------------------------------
// Login.jsx
// Login interface for Hooked (in progress)
// Authors: Eleanor Liu, Lucille Rizo Patron
// -----------------------------------------------------------------------

import {useCallback, useEffect, useState} from 'react'
import { useNavigate } from 'react-router-dom'

// styles
import { getScreenStyle } from './styles'
import './index.css'

//circles
import Circle from "./AnimatedCircle.jsx"
import musicNote1 from './musical-note-1.png'
import musicNote2 from './musical-note-2.png'

// auth
import { useAuth } from './AuthContext'

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
        <div style = {{...getScreenStyle(
            'rgba(170, 109, 217, 0.4)',
            'rgba(153, 195, 230, 0.562)',
            'rgba(186, 151, 225, 0.4)',
            'rgba(164, 189, 218, 0.688)'),
            color: '#debff7'}}>

        <div className = 'card'> 

            <div className = 'small-header'> 
                <h1>Login to Account</h1>

                <button className = 'back-btn' onClick={handleBackButton}>
                    ⬅
                </button>
            </div>

        <div> 
        <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className = 'input-box-1'
        />

        <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className = 'input-box-1'
        />
        <button style={buttonStyle} onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "Hide Password" : "Show Password"}
        </button>

        </div>

        <button className = 'btn-2' onClick={() => handleDone(username, password)}>
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



        <button className = 'btn-2' onClick={() => handleDone(username, password)}>
            Forgot Password
        </button>

            <Circle image={musicNote1} alpha={0.008}/>            
            <Circle image={musicNote1} alpha={0.008}/>    
            <Circle image={musicNote1} alpha={0.008}/>    
            <Circle image={musicNote2} alpha={0.008}/>    
            <Circle image={musicNote2} alpha={0.008}/>    
            <Circle image={musicNote2} alpha={0.008}/>    

        </div>
        </div>
    );
}

// -------------------- EXPORT --------------------
export default Login