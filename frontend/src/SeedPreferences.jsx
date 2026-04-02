// -----------------------------------------------------------------------
// SeedPreferences.jsx
// Swipe Interface for Hooked
// Author: Eleanor Liu
// Contributors:  Lucille Rizo Patron
// -----------------------------------------------------------------------

import React from 'react'
import {useCallback, useEffect, useState} from 'react'
import { useNavigate} from 'react-router-dom'

const GENRES = [
    "pop", "hip-hop", "r&b",
    "rock", "electronic", "country",
    "jazz", "classical", "latin",
    "alternative", "metal", "indie",
]

function SeedPreferences(){
    const navigate = useNavigate()
    const [selected, setSelected] = useState(new Set())

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
        <div style={screenStyle}>
            <h1>Preferences</h1>

            <div style={gridStyle}>
                {GENRES.map(genre => (
                    <button
                        key={genre}
                        style={{
                            ...prefButtonStyle,
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
                <button style={buttonStyle} onClick={handleClickGoNext}>
                    Skip
                </button>

                <button style={buttonStyle} onClick={handleClickGoNext}>
                    Done
                </button>
            </div>
        </div>
    )
}

const screenStyle = {
    minHeight: '100vh',
    backgroundColor: '#18171d',
    color: '#debff7',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
}

const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
}

const prefButtonStyle = {
    padding: '15px 35px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    transition: 'background-color 0.15s, color 0.15s',
}

const buttonStyle = {
    padding: '15px 35px',
    fontSize: '16px',
    backgroundColor: '#debff7',
    color: '#1d1133',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
}

export default SeedPreferences