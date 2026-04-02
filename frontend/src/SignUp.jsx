// -----------------------------------------------------------------------
// WelcomePage.jsx
// Swipe interface for Hooked (in progress)
// Authors: Eleanor Liu
// -----------------------------------------------------------------------

import React from 'react'
import {useCallback, useEffect} from 'react'
import { useNavigate} from 'react-router-dom'

function SignUp(){

    // this makes it go from one screen to another
    const navigate = useNavigate()

    function handleBackButton() {
        console.log("back button clicked, go back to welcome page")
        navigate('/')
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

    return(
        <div style = {screenStyle}> 
            Create an Account 
            <button style={backButtonStyle} onClick = {handleBackButton}> 
                Back 
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

const backButtonStyle = {
    padding: '15px 35px',
    fontSize: '16px',
    backgroundColor: '#debff7',
    color: '#1d1133',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
}

export default SignUp