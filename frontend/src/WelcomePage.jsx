// -----------------------------------------------------------------------
// WelcomePage.jsx
// Swipe interface for Hooked (in progress)
// Authors: Eleanor Liu
// -----------------------------------------------------------------------

import React from 'react'
import {useCallback, useEffect} from 'react'
import { useNavigate} from 'react-router-dom'

function WelcomePage(){
    // this makes it go from one screen to another
    const navigate = useNavigate()

    function handleLoginClick() {
        console.log("login button clicked, teleport to login pg")
        navigate('/login')
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
                    <button style={loginButtonStyle} onClick={(handleLoginClick)}>
                        Login
                    </button>

                    <button style={signupButtonStyle} onClick={(handleCreateClick)}> 
                        Sign Up
                    </button>
        </div>
        
        
    )
}

// --------------------------------- Styles --------------------------------

const screenStyle = {
    minHeight: '100vh',
    backgroundColor: '#18171d',
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