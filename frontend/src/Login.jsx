// -----------------------------------------------------------------------
// Login.jsx
// Login interface for Hooked (in progress)
// Authors: Eleanor Liu, Lucille Rizo Patron
// -----------------------------------------------------------------------

import {useCallback, useEffect, useState} from 'react'
import { useNavigate } from 'react-router-dom'
import { getScreenStyle } from './styles'
import './index.css'

//circles
import Circle from "./AnimatedCircle.jsx"
import musicNote1 from './musical-note-1.png'
import musicNote2 from './musical-note-2.png'

function Login(){

    // this makes it go from one screen to another
    const navigate = useNavigate()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    function handleBackButton() {
        console.log("back button clicked, go back to welcome page")
        navigate(-1)
    }

    async function handleDone(myUsername, myPassword){
        console.log("lets see if the pw is right")

        const result = await fetch('/api/checkpw', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: myUsername, password: myPassword })
        })
        const data = await result.json()

        if (data.logged_in) {
            navigate('/swipe')
        } else {
            alert('Wrong username or password!')
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