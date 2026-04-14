// -----------------------------------------------------------------------
// SeedPreferences.jsx
// Swipe Interface for Hooked
// Author: Eleanor Liu
// Contributors:  Lucille Rizo Patron
// -----------------------------------------------------------------------

import React from 'react'
import {useCallback, useEffect, useState} from 'react'
import { useNavigate} from 'react-router-dom'
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
    const navigate = useNavigate()
    const [selected, setSelected] = useState(new Set())
    const { fetchUser } = useAuth() // fetch from auth

    function handleClickGoNext() {
        handleContinue()
        navigate('/swipe')
    }

    async function handleContinue() {
        await fetch('/api/preferences', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prefs: [...selected] })  // selected is your Set
        })
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