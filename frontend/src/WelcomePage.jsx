// -----------------------------------------------------------------------
// WelcomePage.jsx
// Swipe interface for Hooked (in progress)
// Authors: Eleanor Liu
// -----------------------------------------------------------------------

import React from 'react'
import {useState, useRef, useEffect} from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

function WelcomePage(){
    // this makes it go from one screen to another
    const navigate = useNavigate()

    useEffect(() => { 
        const handleKeyPress = (e) => {
            if (e.key === ' ' || e.code === "Space") {
                console.log('Space pressed')
                navigate('/createAccount')
            }
        }
            
        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
        }, [])

    return(
        <div> Welcome to Hooked </div>
    )
}

export default WelcomePage