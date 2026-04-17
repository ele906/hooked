// -----------------------------------------------------------------------
// WelcomePage.jsx
// Swipe interface for Hooked (in progress)
// Authors: Eleanor Liu, Lucille Rizo Patron
// -----------------------------------------------------------------------

import React from 'react'
import {useCallback, useEffect, useState} from 'react'
import { useNavigate} from 'react-router-dom'
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
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [email, setEmail] = useState("")
    const [profileImg, setProfileImg] = useState(null) // blob url
    const [imageFile, setImageFile] = useState(null) // actual File object

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
        const imageUrl = imageFile ? await uploadToCloudinary(imageFile) : ''

        const res = await fetch('/auth/signup', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email, 
                username, 
                password, 
                user_image_url: imageUrl   // real URL now
            })
        })
                const data = await res.json()

        if (res.ok) {
            await fetchUser()
            navigate('/seedprefs')
        } else {
            alert(data.error)
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
            color: '#debff7'}}>

        <div className = 'card'> 

            <div className = 'small-header'> 
            <h1> Create an Account </h1>
            
            </div>

            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className = 'input-box-4'
            />

            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className = 'input-box-4'
            />

            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className = 'input-box-4'
            />
            
            <div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
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
                        marginTop: '12px',
                        marginBottom: '12px',
                        maxWidth: '200px',
                    }}
                >
                    {profileImg
                        ? <img src={profileImg} alt="profile" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                        : <p>Drag & drop a profile photo here</p>
                    }
                </div>
            </div>
            
            <button className = 'btn-2' onClick = { () => {
                console.log("back button clicked! lets migrate to welcome page")
                navigate('/')
            }}> 
                ⬅ 
            </button>

            <button className='btn-2' onClick={handleSignUp}>
                Create!
            </button>
            </div>

            <Circle image={musicNote1} alpha={0.008}/>            
            <Circle image={musicNote1} alpha={0.008}/>    
            <Circle image={musicNote1} alpha={0.008}/>    
            <Circle image={musicNote2} alpha={0.008}/>    
            <Circle image={musicNote2} alpha={0.008}/>    
            <Circle image={musicNote2} alpha={0.008}/>  

        </div>
        </div>
    )
}


// --------------------------------- EXPORT --------------------------------

export default SignUp