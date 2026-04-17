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

    const { fetchUser } = useAuth() 

    async function handleDone(myUsername, myPassword){
        console.log("validate password")

        const result = await fetch('/api/checkpw', {
            method: 'POST',
            credentials: 'include',
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
            await fetchUser()
            navigate('/swipe')
        } else {
            alert('Wrong username or password!')
        }
    }

    function handleBackButton() {
        console.log("back button clicked, go back to sw9pe page")
        navigate(-1)
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
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className = 'input-box-1'
        />

        </div>

        <button className = 'btn-2' onClick={() => handleDone(username, password)}>
            Done
        </button>

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