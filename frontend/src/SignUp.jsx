// -----------------------------------------------------------------------
// WelcomePage.jsx
// Swipe interface for Hooked (in progress)
// Authors: Eleanor Liu
// Contributors:  Lucille Rizo Patron
// -----------------------------------------------------------------------

import React from 'react'
import {useCallback, useEffect} from 'react'
import { useNavigate} from 'react-router-dom'

function SignUp(){

    // this makes it go from one screen to another
    const navigate = useNavigate()

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
            Create an Account <br />
            
            <button style={backButtonStyle} onClick = { () => {
                console.log("back button clicked! lets migrate to welcome page")
                navigate('/')
            }}> 
                Back 
            </button>

            <button style={backButtonStyle} onClick = {() => {
                navigate('/seedprefs')
                console.log("we are going to seed our preferences")}
                }> 
                Seed Preferences 
            </button>
        </div>
    )
}


// --------------------------------- Styles --------------------------------
const screenStyle = {
    minHeight: '100vh',
    backgroundColor: '#18171d',
    backgroundImage: `
        radial-gradient(circle at 20% 30%, rgba(213, 127, 217, 0.4) 0%, transparent 30%),
        radial-gradient(circle at 80% 20%, rgba(109, 166, 215, 0.25) 0%, transparent 30%),
        radial-gradient(circle at 85% 85%, rgba(148, 123, 176, 0.4) 0%, transparent 30%),
        radial-gradient(circle at 15% 90%, rgba(108, 148, 201, 0.3) 0%, transparent 30%)
    `,
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