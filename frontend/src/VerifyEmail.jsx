import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import API_URL from './config'
import { getScreenStyle, cornerButtonStyle } from './styles'
import Circle from './AnimatedCircle.jsx'
import musicNote1 from './musical-note-1.png'
import musicNote2 from './musical-note-2.png'
import './index.css'

function VerifyEmail() {
    const { token } = useParams()
    const navigate = useNavigate()
    const [status, setStatus] = useState("Verifying...")

    useEffect(() => {
        fetch(`${API_URL}/auth/verify-email/${token}`)
            .then(r => r.json().then(d => ({ ok: r.ok, d })))
            .then(({ ok, d }) => {
                setStatus(ok ? "Email verified! You can now log in." : (d.error || "Verification failed"))
            })
            .catch(() => setStatus("Verification failed"))
    }, [token])

    const success = status.toLowerCase().includes('verified')

    return (
        <div style={{...getScreenStyle(
            'rgba(170, 109, 217, 0.4)',
            'rgba(230, 167, 255, 0.64)',
            'rgba(186, 151, 225, 0.4)',
            'rgba(154, 177, 255, 0.69)'),
            color: '#debff7'}}>

            <div className='welcome-card-style'>
                <div className='login-header-style'>Email Verification</div>

                <button style={{...cornerButtonStyle('top', 'left')}} onClick={() => navigate('/login')}>
                    ⬅
                </button>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <p style={{
                        color: success ? '#7fffd4' : '#ff9aa2',
                        fontSize: '16px',
                        textAlign: 'center',
                        margin: 0,
                        fontWeight: 'bold'
                    }}>
                        {status}
                    </p>

                    <button className='login-button' onClick={() => navigate('/login')}>Go to Login</button>
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

export default VerifyEmail
