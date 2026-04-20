import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API_URL from './config'
import { getScreenStyle, cornerButtonStyle } from './styles'
import Circle from './AnimatedCircle.jsx'
import musicNote1 from './musical-note-1.png'
import musicNote2 from './musical-note-2.png'
import './index.css'

function ForgotPassword() {
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [msg, setMsg] = useState("")

    const handleSubmit = async () => {
        setMsg("")
        const res = await fetch(`${API_URL}/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        })
        if (res.ok) {
            setMsg("If that email is registered, a reset link has been sent.")
        } else {
            const data = await res.json().catch(() => ({}))
            setMsg(data.error || "Something went wrong")
        }
    }

    return (
        <div style={{...getScreenStyle(
            'rgba(170, 109, 217, 0.4)',
            'rgba(230, 167, 255, 0.64)',
            'rgba(186, 151, 225, 0.4)',
            'rgba(154, 177, 255, 0.69)'),
            color: '#debff7'}}>

            <div className='welcome-card-style'>
                <div className='login-header-style'>Forgot Password</div>

                <button style={{...cornerButtonStyle('top', 'left')}} onClick={() => navigate('/login')}>
                    ⬅
                </button>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <p style={{ margin: 0, textAlign: 'center', opacity: 0.9 }}>
                        Enter your email and we will send a reset link.
                    </p>

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className='input-login'
                        style={{ width: '100%', maxWidth: '300px' }}
                    />

                    {msg && <p style={{ color: '#a9d5ff', fontSize: '13px', margin: 0, textAlign: 'center' }}>{msg}</p>}

                    <button className='login-button' onClick={handleSubmit}>Send Reset Link</button>
                    <button className='secondary-login-button' onClick={() => navigate('/login')}>Back to Login</button>
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

export default ForgotPassword
