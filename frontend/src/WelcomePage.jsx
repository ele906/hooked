// -----------------------------------------------------------------------
// WelcomePage.jsx
// Swipe interface for Hooked (in progress)
// Authors: Eleanor Liu, Lucille Rizo Patron
// -----------------------------------------------------------------------

import React from 'react'
import {useCallback, useEffect} from 'react'
import { useNavigate} from 'react-router-dom'
import Circle from "./AnimatedCircle.jsx";
import API_URL from './config'

function WelcomePage(){
    // this makes it go from one screen to another
    const navigate = useNavigate()

    function handleLoginClick() {
        navigate('/login')
        console.log("login button clicked, teleport to login pg")
    }

    function handleGoogleClick() {
        console.log("login button clicked, teleport to login pg")
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
        <div style={screenStyle} >
            <h1> Hooked </h1>
            <div> Reel in Your Next Playlist </div>
                {/* teleports to either login or signup*/}

                    <Circle />
                    <Circle />
                    <Circle />
                    <Circle />
                    <Circle />
                    <Circle />                    
                    <Circle />
                    <Circle />
                    <Circle />

                    <button style={loginButtonStyle} onClick={(handleLoginClick)}>
                        Login
                    </button>

                    <button style={signupButtonStyle} onClick={(handleCreateClick)}> 
                        Sign Up
                    </button>

                    <button style={loginButtonStyle} onClick={handleGoogleClick}>
                        Continue with Google
                    </button>

        </div>
        
        
    )
}

// --------------------------------- Styles --------------------------------

const screenStyle = {
    minHeight: '100vh',
    backgroundColor: '#18171d',
    backgroundImage: `
        radial-gradient(circle at 20% 30%, rgba(158, 123, 255, 0.4) 0%, transparent 30%),
        radial-gradient(circle at 80% 20%, rgba(68, 161, 178, 0.25) 0%, transparent 30%),
        radial-gradient(circle at 85% 85%, rgba(219, 100, 165, 0.4) 0%, transparent 30%),
        radial-gradient(circle at 15% 90%, rgba(126, 169, 194, 0.3) 0%, transparent 30%)
    `,
    color: '#debff7',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    position: 'relative',
}

const loginButtonStyle = {
    padding: '15px 35px',
    fontSize: '16px',
    backgroundColor: '#debff7',
    color: '#1d1133',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
}


const signupButtonStyle = {
    padding: '15px 35px',
    fontSize: '16px',
    backgroundColor: '#debff7',
    color: '#1d1133',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
}


export default WelcomePage