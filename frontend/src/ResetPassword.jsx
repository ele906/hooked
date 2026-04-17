import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import API_URL from './config'

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
            credentials: "include",
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

    // TODO: Style
    return (
        <div>
            <h2>Set a new password</h2>
            {msg && <p>{msg}</p>}
            <input type="password" placeholder="New password"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            <input type="password" placeholder="Confirm password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <button onClick={handleSubmit}>Reset password</button>
        </div>
    )
}

export default ResetPassword
