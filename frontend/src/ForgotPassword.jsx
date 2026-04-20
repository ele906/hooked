import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API_URL from './config'

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

    // TODO: Style 
    return (
        <div>
            <h2>Forgot Password</h2>
            {msg && <p>{msg}</p>}
            <input type="email" placeholder="Email"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            <button onClick={handleSubmit}>Send reset link</button>
            <button onClick={() => navigate('/login')}>Back to login</button>
        </div>
    )
}

export default ForgotPassword
