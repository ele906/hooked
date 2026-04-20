// -----------------------------------------------------------------------
// WelcomePage.jsx
// Swipe interface for Hooked (in progress)
// Authors: Eleanor Liu, Lucille Rizo Patron
// -----------------------------------------------------------------------

import React from 'react'
import {useCallback, useEffect, useState} from 'react'
import { useNavigate} from 'react-router-dom'
import API_URL from './config'
import { getScreenStyle } from './styles'
import './index.css'
import { useAuth } from './AuthContext'

//circles
import Circle from "./AnimatedCircle.jsx"
import musicNote1 from './musical-note-1.png'
import musicNote2 from './musical-note-2.png'

function SignUp(){

    const navigate = useNavigate() // this makes it go from one screen to another
    const { fetchUser } = useAuth() // fetch user
    const [email, setEmail] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [imageFile, setImageFile] = useState(null)
    const [profileImg, setProfileImg] = useState(null)

    async function uploadToCloudinary(file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', 'a3grzjto')

        const res = await fetch('https://api.cloudinary.com/v1_1/dutrsvhz4/image/upload', {
            method: 'POST',
            body: formData
        })
        const data = await res.json()
        return data.secure_url
    }

    async function handleSignUp() {
        if (password.length < 8) {
            setError("Password must be at least 8 characters")
            return
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        const imageUrl = imageFile ? await uploadToCloudinary(imageFile) : ''

        const res = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email, 
                username, 
                password,
                user_image_url: imageUrl
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


    function handleDrop(e) {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith('image/')) {
            setImageFile(file)                               // save File
            setProfileImg(URL.createObjectURL(file))         // just for preview
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

    function handleBackButton() {
        console.log("back button clicked, go back to welcome page")
        navigate(-1)
    }

    function handleDragOver(e) {
        e.preventDefault() // required, otherwise drop won't fire
    }

    return(
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

        <div className = 'card' style={{ width: 'min(90vw, 420px)', height: 'auto', maxHeight: '90vh', overflowY: 'auto' }}> 

            <div className = 'card-header'> 
                <button className='back-btn' onClick={handleBackButton} style={{ position: 'absolute', left: '12px' }}>
                    ⬅
                </button>
                <h2 style={{ flex: 1, textAlign: 'center' }}>Create Account</h2>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className='input-box-4'
                    style={{ width: '100%', maxWidth: '300px' }}
                />

                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className='input-box-4'
                    style={{ width: '100%', maxWidth: '300px' }}
                />

                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className='input-box-4'
                    style={{ width: '100%', maxWidth: '300px' }}
                />

                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className='input-box-4'
                    style={{ width: '100%', maxWidth: '300px' }}
                />

                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    style={{
                        border: '2px dashed #debff7',
                        borderRadius: '12px',
                        padding: '24px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        color: '#debff7',
                        width: '100%',
                        maxWidth: '280px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        backgroundColor: 'rgba(222, 191, 247, 0.05)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(222, 191, 247, 0.15)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(222, 191, 247, 0.05)' }}
                >
                    {profileImg
                        ? <img src={profileImg} alt="profile" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                        : <p style={{ margin: 0, fontSize: '14px' }}>Drag & drop profile photo</p>
                    }
                </div>

                {error && <p style={{ color: '#ff6b6b', fontSize: '13px', margin: 0, textAlign: 'center' }}>{error}</p>}

                <button
                    style={{
                        backgroundColor: '#debff7',
                        color: '#1d1133',
                        padding: '12px 32px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        marginTop: '12px',
                        fontSize: '16px',
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 'bold',
                        width: '100%',
                        maxWidth: '300px',
                        transition: 'all 0.3s ease'
                    }}
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