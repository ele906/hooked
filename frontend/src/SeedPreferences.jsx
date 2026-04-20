// -----------------------------------------------------------------------
// SeedPreferences.jsx
// Swipe Interface for Hooked
// Author: Eleanor Liu,  Lucille Rizo Patron
// -----------------------------------------------------------------------
/* eslint-disable react-hooks/rules-of-hooks */

import React from 'react'
import {useCallback, useEffect, useState} from 'react'
import { useNavigate} from 'react-router-dom'
import API_URL from './config'
import Circle from "./AnimatedCircle.jsx"
import { getScreenStyle } from './styles'
import musicNote1 from './musical-note-1.png'
import musicNote2 from './musical-note-2.png'
import './index.css'
import { useAuth } from './AuthContext'

const GENRES = [
    "pop", "hip-hop", "r&b",
    "rock", "electronic", "country",
    "jazz", "classical", "latin",
    "alternative", "metal", "indie",
]

function SeedPreferences(){
    if (!sessionStorage.getItem('username')) {
        window.location.replace(
            API_URL + '/auth/login?originalurl=' + window.location.pathname
        )
        return null
    }

    const navigate = useNavigate()
    const [selected, setSelected] = useState(new Set())
    const { fetchUser } = useAuth() // fetch from auth

    function handleClickGoNext() {
        handleContinue()
        navigate('/swipe')
    }

    async function handleContinue() {
        const response = await fetch(`${API_URL}/api/preferences`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + sessionStorage.getItem('accesstoken'),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prefs: [...selected] })
        })
        if (response.status === 401 || response.status === 422) {
            window.location.replace(
                API_URL + '/auth/login?originalurl=' + window.location.pathname
            )
            return
        }
        navigate('/swipe')
    }

    function handlePrefClick(txt){
        setSelected(prev => {
            const next = new Set(prev)
            next.has(txt) ? next.delete(txt) : next.add(txt)
            return next
        })
    }

    const handleKeyPress = useCallback((e) => {
        if (e.key === 'L' || e.key === "l") navigate('/login')
        if (e.key === 'C' || e.key === "c") navigate('/signup')
    }, [navigate])

    useEffect(() => { 
        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [handleKeyPress])

    return(
        <div style = {{...getScreenStyle(
            'rgba(158, 123, 255, 0.4)',
            'rgba(68, 161, 178, 0.25)',
            'rgba(219, 100, 165, 0.4)',
            'rgba(126, 169, 194, 0.3)'),
            color: '#debff7'}}>

            <div style={{ position: 'fixed', top: '16px', left: '16px', display: 'flex', gap: '8px', zIndex: 100 }}>
                <button className='back-btn' onClick={() => navigate(-1)}>Back</button>
                <button onClick={() => window.location.href = `${API_URL}/logoutapp`}>Logout</button>
            </div>

            <h1>Preferences</h1>

            <div className = 'genre-grid'>
                {GENRES.map(genre => (
                    <button
                        key={genre}
                        className="pref-button"
                        style={{
                            backgroundColor: selected.has(genre) ? '#debff7' : '#825f9f',
                            color: selected.has(genre) ? '#1d1133' : '#d1c1ef',
                        }}
                        onClick={() => handlePrefClick(genre)}
                    >
                        {genre}
                    </button>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '50px' }}>
                <button className = 'btn-1' onClick={handleClickGoNext}>
                    Skip
                </button>

                <button className = 'btn-1' onClick={handleClickGoNext}>
                    Done
                </button>
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


// -------------------- EXPORT --------------------
export default SeedPreferences