import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import API_URL from './config'
import { getScreenStyle, cornerButtonStyle } from './styles'
import Circle from './AnimatedCircle.jsx'
import musicNote1 from './musical-note-1.png'
import musicNote2 from './musical-note-2.png'
import './index.css'

function ResetPassword() {
    const navigate = useNavigate()
    const { token } = useParams()
    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [msg, setMsg] = useState("")

    const handleSubmit = async () => {
        setMsg("")
        if (password.length < 8) { setMsg("Password must be at least 8 characters"); return }
        if (password !== confirm) { setMsg("Passwords do not match"); return }
        const res = await fetch(`${API_URL}/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, password }),
        })
        const data = await res.json()
        if (res.ok) {
            setMsg("Password reset! Redirecting to login...")
            setTimeout(() => navigate('/login'), 1500)
        } else {
            setMsg(data.error || "Reset failed")
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
                <div className='login-header-style'>Set New Password</div>

                <button style={{...cornerButtonStyle('top', 'left')}} onClick={() => navigate('/login')}>
                    ⬅
                </button>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <input
                        type="password"
                        placeholder="New password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className='input-login'
                        style={{ width: '100%', maxWidth: '300px' }}
                    />

                    <input
                        type="password"
                        placeholder="Confirm password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className='input-login'
                        style={{ width: '100%', maxWidth: '300px' }}
                    />

                    {msg && <p style={{ color: msg.includes('failed') ? '#ff8080' : '#a9d5ff', fontSize: '13px', margin: 0, textAlign: 'center' }}>{msg}</p>}

                    <button className='login-button' onClick={handleSubmit}>Reset Password</button>
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

export default ResetPassword
