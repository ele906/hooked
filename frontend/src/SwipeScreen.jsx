// -----------------------------------------------------------------------
// SwipeScreen.jsx
// Swipe Interface for Hooked
// Author: Lucille Rizo Patron
// Contributors: Eleanor Liu
// -----------------------------------------------------------------------

import React from 'react'
import {useState, useRef, useEffect} from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import searchIcon from './search_button.png'

// Renders the swipe screen interface based on user mouse and keyboard 
// actions
function SwipeScreen() {

    // ------------- Screen Flow -----------------------------------------

    // enables flow from one screen to another
    const navigate = useNavigate()

    // catch data passed from search screen
    const location = useLocation()

    // ------------- States + Refs ---------------------------------------

    // tracks current position 
    const [offsetX, setOffsetX] = useState(0)

    // isDragging tracks whether the user is currently dragging the card
    const [isDragging, setIsDragging] = useState(false)

    // horizontal start position of the drag (in pixels)
    const dragStartX = useRef(0)

    // the song currently on screen
    const [currentSong, setCurrentSong] = useState(null)

    const [userId, setUserId] = useState(null)

    useEffect(() => {
        fetch("http://localhost:5000/auth/user", { credentials: "include" })
            .then(res => res.json())
            .then(data => setUserId(data.user_id))
            .catch(() => {})
    }, [])

    // swipe card component
    const cardRef = useRef(null)

    // message shows like or dislike after swiping
    const [message, setMessage] = useState("")

    // ------------------ Song Fetching ----------------------------------

    // send user like/dislike action to database, then fetch next song
    // takes a string action, 'like' or 'dislike', as a parameter
    function handleAction(action) {
        fetch("http://localhost:5000/api/songs/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // tracks user interaction with song
            body: JSON.stringify({ user_id: userId, 
                                   song_id: currentSong.song_id, 
                                   action })
        }).then(() => fetchNextSong())
    }

    // fetch next song from backend & reset visual state for new song card
    function fetchNextSong() {
        fetch(`http://localhost:5000/api/songs/next?user_id=${userId}`)
            .then(res => res.json())
            .then(data => {
                // reset card to center position
                setOffsetX(0)
                if (data && data.song_id) {
                    setCurrentSong(data)
                    setMessage("")
                } else {
                    // end of song list
                    setCurrentSong(null)
                    setMessage("No more songs!")
                }
            })
            .catch(err => {
                console.error("Fetch error:", err)
                setCurrentSong(null)
                setMessage("Server Error")
            })
    }

    // initial load: fetch first song to start swipe session
    useEffect(() => {
        // check for song clicked on search page
        const clickedSong = location.state?.song

            if (clickedSong) {
                // arrived from search result
                setCurrentSong(clickedSong)
            } else {
                // arrived directly
                fetchNextSong()
            }
        }, [userId])

    // -----------------------  Drag Swipe -------------------------------
    
    // triggers the card fly-off animation (left or right) based on
    // user action via drag, button click, or keyboard keys
    // takes a string action, 'like' or 'dislike', as parameters
    const doSwipe = (action) => {
        // large offset to slide completely off screen
        const flyOff = action === 'like' ? 1500 : -1500
        setOffsetX(flyOff)

        setMessage(action === 'like' ? "♥ Liked!" : "✕ Skipped!")

        // pause to let transition finish before new card data
        setTimeout(() => {
            handleAction(action) 
        }, 400)
    }

    // Sets state to dragging started
    // takes mouse event e as param
    function dragStart(e) {
        setIsDragging(true)
        // capture exact position of click start
        dragStartX.current = e.pageX 
    }

    // Updates position state as the card is dragged
    useEffect(() => {
        // calculate how far mouse has moved
        // takes mouse event e as param
        const handleMouseMove = (e) => {
            if (!isDragging) return
            const displacement = e.pageX - dragStartX.current
            setOffsetX(displacement)
        }
        
        // Checks whether the user liked (dragged the card right), 
        // skipped (dragged the card left), or didn't decide (didn't drag
        // far enough). Sets state to dragging ended.
        const handleMouseUp = () => {
            if (!isDragging) return

            const dragThreshold = 150

            // if user dragged past threshold pixels, it counts as swipe
            if (offsetX > dragThreshold) { //dragged right
                doSwipe('like')
            } else if (offsetX < -dragThreshold) { //dragged left
                doSwipe('dislike')
            } else { //not dragged enough
                setOffsetX(0)
                setMessage("")
            }
            setIsDragging(false)
        }
        
        // respond to user mouse movements
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        // clean up listeners
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, offsetX])

    // ------------------- Keyboard Swipe --------------------------------  

    // Handle keyboard left and right arrow keys
    useEffect(() => { 
        // takes keyboard event e as param
        const handleKeyPress = (e) => {
            if (Math.abs(offsetX) > 100) return // prevent key spamming
            if (e.key === 'ArrowLeft') doSwipe('dislike')
            if (e.key === 'ArrowRight') doSwipe('like')
        }

        // respond to user keyboard actions
        window.addEventListener('keydown', handleKeyPress)
        // clean up listeners
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [currentSong])

    // --------------------- Swipe Screen Rendering ----------------------

    // main swipe UI
    return (
        <div style={screenStyle}> 

            {/* search button to go to search page */}
            <button 
                style={cornerButtonStyle('right', 'bottom')} 
                onClick={() => navigate('/search') }
            >
                <img 
                    src={searchIcon} 
                    style={{ width: '30px', height: '30px' }} 
                />
            </button>

            {/* button to go to liked songs page */}
            <button 
                style={cornerButtonStyle('left', 'bottom')}
                onClick={() => navigate('/liked')}>
                ♥
            </button>

            {/* if no song loaded, show final message or loading screen */}
            {!currentSong ? (
                <p style={{color: 'white', fontSize: '18px', textAlign: 'center'}}>
                    {message || "Loading..."}
                </p>
            ) : (   
                /* if song loaded, show swipe screen */
                <>
                    {/* liked/disliked message after swipe above card*/}
                    <p style={messageStyle}>{message}</p>

                    {/* swipe card */}
                    <div
                        ref = {cardRef}
                        style={{...cardRefStyle,
                            transition: isDragging
                                // if dragging, card sticks to mouse 
                                ? 'none' 
                                // not dragging, card flies off or snaps back with curve
                                : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            transform: 
                                // mimic how card in real life slides off
                                `translateX(${offsetX}px) rotate(${offsetX / 20}deg)`, 
                            // ensure swipe card stays on top of everything
                            zIndex: isDragging ? 100 : 1 
                        }}
                        onMouseDown={dragStart}
                    >   

                        {/* album art */}
                        {/* display song image or a default music icon */}
                        {currentSong.song_image_url ? (
                            <img 
                                src={currentSong.song_image_url} 
                                alt={currentSong.song_name}
                                // prevent image dragging
                                onDragStart={(e) => e.preventDefault()}
                                style={{ width: '220px', 
                                        height: '220px', 
                                        borderRadius: '12px', 
                                        objectFit: 'cover', 
                                        pointerEvents: 'none',
                                        margin: '0 0 25px 0' }}
                            />
                        ) : (
                            <p style={{fontSize: '120px', margin: '0 0 25px 0'}}>♫</p>
                        )}
                        {/* audio preview */}
                        <div style={{ filter: 'brightness(0.7)', 
                                    display: 'flex',
                                    justifyContent: 'center'
                        }}>
                            <audio src={currentSong.preview_mp3_url} 
                                autoPlay 
                                controls 
                                style={{ width: '220px'}}/>
                        </div>

                        {/* song info */}
                        <h2 style={{
                            margin: '0 0 8px 0', 
                            fontFamily: 'Outfit, sans-serif', 
                            marginTop: '20px'
                        }}> 
                            {currentSong.song_name}</h2>
                        <p style={{
                            color: '#ffffffad', 
                            fontFamily: 'Outfit, sans-serif', 
                            margin: 0
                        }}> 
                            {currentSong.artist_name}</p>

                        {/* user instructions */}
                        <p style={{
                            color: '#deb6ff9d', 
                            fontFamily: 'Outfit, sans-serif', 
                            fontSize: '13px', 
                            marginTop: '20px'
                        }}>
                            Swipe left to skip, right to like
                        </p>
                        
                        {/* Like and skip buttons (as an alternative to swiping) */}
                        <div style={{
                            display: 'flex', 
                            justifyContent: 'center', 
                            gap: '45px', 
                            marginTop: '25px'
                        }}>
                            <button style={skipButtonStyle} 
                                onClick={() => doSwipe('dislike')}>
                                ✕ Skip
                            </button>
                            <button style={likeButtonStyle} 
                                onClick={() => doSwipe('like')}>
                                ♥ Like
                            </button>
                        </div>

                    </div>

                </>)} 
                
        </div>
    )
}

// --------------------------------- Styles --------------------------------

// background
const screenStyle = {
    minHeight: '100vh',
    backgroundColor: '#121214',
    backgroundImage: `
        radial-gradient(circle at 20% 30%, rgba(158, 123, 255, 0.4) 0%, transparent 30%),
        radial-gradient(circle at 80% 20%, rgba(0, 217, 255, 0.25) 0%, transparent 30%),
        radial-gradient(circle at 85% 85%, rgba(112, 59, 173, 0.4) 0%, transparent 30%),
        radial-gradient(circle at 15% 90%, rgba(0, 128, 128, 0.3) 0%, transparent 30%)
    `,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    position: 'relative',
}

const messageStyle = {
    color: '#50fff6',
    fontSize: '18px',
    fontWeight: 'bold',
    fontFamily: 'Outfit, sans-serif',
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
    backgroundColor: '#50fff6',
    color: '#1d1133',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
}

// button style to navigate among screens from swipe screen
// takes string sides: sideX to determine right or left placement
// and sideY to determine bottom or top placement
const cornerButtonStyle = (sideX, sideY) => ({
    position: 'fixed',
    width: '50px',
    height: '50px',
    [sideX]: '15px',
    [sideY]: '15px',
    backgroundColor: '#a995dd4f',
    color: '#180d2b',
    fontSize: '30px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',   
    zIndex: 9999,
})

// swipe card
const cardRefStyle = {
    position: 'relative',
    width: '350px',
    padding: '100px 40px',
    backgroundColor: '#7a779636',
    borderRadius: '25px',
    textAlign: 'center',
    color: 'white',
    cursor: 'grab',
    userSelect: 'none',
}

export default SwipeScreen
