// -----------------------------------------------------------------------
// SwipeScreen.jsx
// Swipe interface for Hooked (in progress)
// Author: Lucille Rizo Patron
// Contributor: Eleanor Liu
// -----------------------------------------------------------------------
import React from 'react'
import {useState, useRef, useEffect} from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import searchIcon from './search_button.png'  // path relative to your file

function SwipeScreen() {

    // tracks current position 
    const currentPosition = useRef(0)

    // message shows like or dislike after swiping
    const [message, setMessage] = useState("")

    // isDragging tracks whether the user is currently dragging the card
    const isDragging = useRef(false)

    // horizontal start position of the drag (in pixels)
    const dragStartX = useRef(0)

    // the song currently on screen
    const [currentSong, setCurrentSong] = useState(null)

    const cardRef = useRef(null)

    // this makes it go from one screen to another
    const navigate = useNavigate()

    // this location from search screen
    const location = useLocation();

    // ------------------ Song Actions + Fetching -------------------

    // post like/dislike action, then fetch next song
    function handleAction(action) {
        fetch("http://localhost:5000/api/songs/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: 1, song_id: currentSong.song_id, action })
        }).then(() => fetchNextSong())
    }

    // fetch next song from backend
    function fetchNextSong() {
        fetch("http://localhost:5000/api/songs/next?user_id=1")
            .then(res => res.json())
            .then(data => {
                if (!data || data.error || !data.song_id) {
                    setCurrentSong(null)
                    setMessage("No more songs!")
                    return
                }
                if (cardRef.current) {
                    cardRef.current.style.transition = 'none'
                    cardRef.current.style.transform = 'translateX(0px)'
                }
                setCurrentSong(data)
                setMessage("")
            })
    }

    // ------------------- Keyboard  ------------------------
    
    // fetch first song on load

    useEffect(() => {
        const clickedSong = location.state?.song;
            if (clickedSong) {
                setCurrentSong(clickedSong);
            } else {
                fetchNextSong();
            }
        }, []);

        
        // Handle keyboard arrow keys and Enter
    useEffect(() => { 
        const handleKeyPress = (e) => {
            if (e.key === 'ArrowRight') {
                cardRef.current.style.transition = 'transform 0.3s ease-out'
                cardRef.current.style.transform = 'translateX(-1500px)'
                setMessage("✕ Skipped!")
                handleAction("dislike")
            } else if (e.key === 'Enter') {
                cardRef.current.style.transition = 'transform 0.3s ease-out'
                cardRef.current.style.transform = 'translateX(1500px)'
                setMessage("♥ Liked!")
                handleAction("like")
            }
        }
        
        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [currentSong])

    // -----------------------  Swipe ------------------------

    // Sets state to dragging started
    function dragStart(e) {
        isDragging.current = true
        dragStartX.current = e.pageX
    }

    // Updates position state as the card is dragged
    useEffect(() => {
    const handleMouseMove = (e) => {
        if (isDragging.current === false) return
        const displacement = e.pageX - dragStartX.current
        currentPosition.current = displacement
        if (cardRef.current) {
            cardRef.current.style.transform = `translateX(${displacement}px)`
        }
    }
    
    // Checks whether the user liked (dragged the card right), skipped 
    // (dragged the card left), or didn'd decide (didn't drag far enough). 
    // Sets state to dragging ended.
    const handleMouseUp = () => {
        if (isDragging.current === false) return
        isDragging.current = false

        const dragThreshold = 150
        let finalPosition = 0

        if (currentPosition.current > dragThreshold) {
            finalPosition = 1500
            setMessage("♥ Liked!")
            handleAction("like")
        } else if (currentPosition.current < -dragThreshold) {
            finalPosition = -1500
            setMessage("✕ Skipped!")
            handleAction("dislike")
        } else {
            setMessage("")
        }

        if (cardRef.current) {
            cardRef.current.style.transition = 'transform 0.3s ease-out'
            cardRef.current.style.transform = `translateX(${finalPosition}px)`
        }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
    }
}, [currentSong])

    

    // --------------------- Swipe Screen Rendering -------------------------------
    
    // card transition set based on dragging state
    if (!currentSong) {
        return <div style={screenStyle}>
            <p style={{color: 'white', fontSize: '18px'}}>
                {message === "No more songs!" ? "You've heard everything!" : "Loading..."}
            </p></div>
    }
    let cardTransition = 'transform 3.0s ease-out'
    if (isDragging.current === true) {
        cardTransition = 'none'
    }

    return (
        <div style={screenStyle}> 
            {/* message after swipe */}
            <p style={messageStyle}>{message}</p>
            {/* song card */}
            <div
                ref = {cardRef}
                style={{
                    ...cardRefStyle,
                    transition: cardTransition
                }}
                onMouseDown={dragStart}
            >   

            {/* Display contents of the song card */}
                {/* album art */}
                {currentSong.song_image_url ? (
                    <img 
                        src={currentSong.song_image_url} 
                        alt={currentSong.song_name}
                        style={{ width: '200px', height: '200px', borderRadius: '12px', objectFit: 'cover', margin: '0 0 23px 0' }}
                    />
                ) : (
                    <p style={{fontSize: '120px', margin: '0 0 23px 0'}}>♫</p>
                )}
                {/* audio player */}
                <div style={{ filter: 'brightness(0.7)', 
                              display: 'flex',
                              justifyContent: 'center'
                }}>
                    <audio src={currentSong.preview_mp3_url} 
                           autoPlay 
                           controls 
                           style={{ width: '220px' }}/>
                </div>
                {/* text data (title, artist) for each song*/}
                <h2 style={{margin: '0 0 8px 0', fontFamily: 'Outfit, sans-serif', marginTop: '20px'}}>{currentSong.song_name}</h2>
                <p style={{color: '#ffffffad', fontFamily: 'Outfit, sans-serif', margin: 0}}>{currentSong.artist_name}</p>
                {/* instructions for user */}
                <p style={{color: '#deb6ff9d', fontFamily: 'Outfit, sans-serif', fontSize: '13px', marginTop: '20px'}}>
                    Swipe right to skip (right arrow), left to like (enter)
                </p>

                {/* search buttons to teleport to search page */}
                    <button style={searchButtonStyle} onClick={() => {
                        cardRef.current.style.transition = 'transform 0.3s ease-out'
                        console.log("search button clicked, teleport to search pg")
                        navigate('/search')
                    }}>
                        <img src={searchIcon} style={{ width: '30px', height: '30px' }} />
                    </button>

                {/* Like and skip buttons (as an alternative to swiping) */}
                <div style={{display: 'flex', justifyContent: 'center', gap: '45px', marginTop: '25px'}}>
                    <button style={skipButtonStyle} onClick={() => {
                        cardRef.current.style.transition = 'transform 0.3s ease-out'
                        cardRef.current.style.transform = 'translateX(-1500px)'
                        setMessage("✕ Skipped!")
                        handleAction("dislike") }}>
                        ✕ Skip
                    </button>
                    <button style={likeButtonStyle} onClick={() => {
                        cardRef.current.style.transition = 'transform 0.3s ease-out'
                        cardRef.current.style.transform = 'translateX(-1500px)'
                        setMessage("♥ Liked!")
                        handleAction("like") }}>
                        ♥ Like
                    </button>
                </div>
            </div>

        </div>
    )
}

// --------------------------------- Styles --------------------------------

const screenStyle = {
    minHeight: '100vh',
    backgroundColor: '#18171d',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    position: 'relative',
}

const messageStyle = {
    color: '#d0ff50',
    fontSize: '18px',
    fontWeight: 'bold',
    height: '25px',
}

const skipButtonStyle = {
    padding: '15px 35px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#bea2ff',
    color: '#1d1133',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
}

const likeButtonStyle = {
    padding: '15px 35px',
    fontSize: '16px',
    backgroundColor: '#d0ff50',
    color: '#1d1133',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
}

const searchButtonStyle = {
    width: '50px',
    height: '50px',
    position: 'absolute',
    backgroundColor: '#aa95dd',
    color: '#1d1133',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    bottom: '15px',
    right: '15px',      
}

const cardRefStyle = {
    position: 'relative',
    width: '350px',
    padding: '100px 40px',
    backgroundColor: '#9e7bff2f',
    borderRadius: '20px',
    textAlign: 'center',
    color: 'white',
    cursor: 'grab',
    userSelect: 'none',
}

export default SwipeScreen
