// -----------------------------------------------------------------------
// WelcomePage.jsx
// Swipe interface for Hooked (in progress)
// Authors: Eleanor Liu, Lucille Rizo Patron
// -----------------------------------------------------------------------

import React from 'react'
import {useCallback, useEffect} from 'react'
import { useNavigate} from 'react-router-dom'
import API_URL from './config'
import Circle from "./AnimatedCircle.jsx"
import musicNote1 from './musical-note-1.png'
import musicNote2 from './musical-note-2.png'
import { getScreenStyle } from './styles'
import './index.css'

function WelcomePage(){
    // this makes it go from one screen to another
    const navigate = useNavigate()

    function handleLoginClick() {
        navigate('/login')
        console.log("login button clicked, teleport to login pg")
    }

    function handleGoogleClick() {
        console.log("Google login button clicked, redirecting to Google OAuth")
        window.location.href = `${API_URL}/auth/login`;
    }

    function handleCreateClick() {
        console.log("create button clicked, teleport to login pg")
        navigate('/signup')
    }

    const handleKeyPress = useCallback((e) => {
        if (e.key === 'L' || e.key === "l") {
            console.log('L key = Login pressed. teleport to login page.')
            navigate('/login')
        }
        if (e.key === 'C' || e.key === "c") {
            console.log('c key pressed. teleport to create acc page.')
            navigate('/signup')
        }
    }, [navigate])

    useEffect(() => { 
        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [handleKeyPress])


    
    return(
        <div style = {{...getScreenStyle(
            'rgba(158, 123, 255, 0.4)',
            'rgba(68, 161, 178, 0.25)',
            'rgba(112, 59, 173, 0.4)',
            'rgba(134, 190, 219, 0.3)'),
            color: '#debff7'}}>
            
            <h1> Hooked </h1>
            <div> Reel in Your Next Playlist </div>
                {/* teleports to either login or signup*/}

                    <Circle image={musicNote1}/>
                    <Circle image={musicNote1}/>
                    <Circle image={musicNote1}/>
                    <Circle image={musicNote1}/>
                    <Circle image={musicNote2}/>
                    <Circle image={musicNote2}/>                    
                    <Circle image={musicNote2}/>
                    <Circle image={musicNote2}/>
                    <Circle image={musicNote2}/>

                    <button className = 'btn-3' onClick={(handleLoginClick)}>
                        Login
                    </button>

                    <button className = 'btn-3' onClick={(handleCreateClick)}> 
                        Sign Up
                    </button>

                    <button className = 'btn-3' onClick={handleGoogleClick}>
                        Continue with Google
                    </button>
        </div>
        
        
    )
}

// -------------------- EXPORT --------------------
export default WelcomePage