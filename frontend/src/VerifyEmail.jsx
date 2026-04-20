import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import API_URL from './config'

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

    // TODO: Style
    return (
        <div>
            <h2>{status}</h2>
            <button onClick={() => navigate('/login')}>Go to login</button>
        </div>
    )
}

export default VerifyEmail
