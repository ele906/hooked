// -----------------------------------------------------------------------
// SwipeScreen.jsx
// Swipe interface for Hooked (in progress)
// Authors: Lucille Rizo Patron
// -----------------------------------------------------------------------
import React from 'react'
import {useState, useRef, useEffect} from 'react'

function SwipeScreen() {
    // tracks how far left or right the card has been dragged (in pixels)
    const [position, setPosition] = useState(0)

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
    const currentSongRef = useRef(null)
    
    useEffect(() => { currentSongRef.current = currentSong }, [currentSong])
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
                setCurrentSong(data)
                setPosition(0)
                setMessage("")
            })
    }

    // fetch first song on load
    useEffect(() => { 
        fetchNextSong()
        
        // Handle keyboard arrow keys and Enter
        const handleKeyPress = (e) => {
            if (e.key === 'ArrowRight') {
                setPosition(-1500)
                setMessage("✕ Skipped!")
                handleAction("dislike")
            } else if (e.key === 'Enter') {
                setPosition(1500)
                setMessage("♥ Liked!")
                handleAction("like")
            }
        }
        
        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [])

    // -----------------------  Swipe Animation Functions ------------------------

    // Sets state to dragging started
    function dragStart(e) {
        isDragging.current = true
        dragStartX.current = e.pageX
    }

    // Updates position state as the card is dragged
    function dragMove(e) {
        if (isDragging.current === false) {
            return
        }
        const displacement = e.pageX - dragStartX.current
        currentPosition.current = displacement
        setPosition(displacement)
    }

    // Checks whether the user liked (dragged the card right), skipped 
    // (dragged the card left), or didn'd decide (didn't drag far enough). 
    // Sets state to dragging ended.
    function dragEnd() {
        if (isDragging.current === false) {
            return
        }
        console.log("position on release:", currentPosition.current)
        isDragging.current = false

        const dragThreshold = 100
        if (currentPosition.current > dragThreshold) {
            setPosition(1500)
            setMessage("♥ Liked!")
            handleAction("like")
        } else if (currentPosition.current < -dragThreshold) {
            setPosition(-1500)
            setMessage("✕ Skipped!")
            handleAction("dislike")
        } else {
            setPosition(0)
            setMessage("")
        }
    }

    // Waiting for the backend to be ready to continue on the song logic section

    // --------------------- Swipe Screen Rendering -------------------------------
    
    // card transition set based on dragging state
    if (!currentSong) {
        return <div style={screenStyle}><p style={{color: 'white'}}>Loading...</p></div>
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
                style={{
                    transform: 'translateX(' + position + 'px)',
                    transition: cardTransition,
                    width: '290px',
                    padding: '100px 40px',
                    backgroundColor: '#9e7bff2f',
                    borderRadius: '20px',
                    textAlign: 'center',
                    color: 'white',
                    cursor: 'grab',
                    userSelect: 'none',
                }}
                onMouseDown={dragStart}
                onMouseMove={dragMove}
                onMouseUp={dragEnd}
                onMouseLeave={dragEnd}
            >   

            {/* Display contents of the song card */}
                {/* placeholder for album art (will be added once we have real song data) */}
                <p style={{fontSize: '120px', margin: '0 0 23px 0'}}>♫</p>
                <audio src={currentSong.preview_mp3_url} autoPlay controls />
                {/* text data (title, artist) for each song*/}
                <h2 style={{margin: '0 0 8px 0'}}>{currentSong.song_name}</h2>
                <p style={{color: '#ffffffad', margin: 0}}>{currentSong.artist_name}</p>
                {/* instructions for user */}
                <p style={{color: '#deb6ff9d', fontSize: '13px', marginTop: '20px'}}>
                    Swipe/Arrow right to skip, Enter to like
                </p>
            </div>

            {/* Like and skip buttons (as an alternative to swiping) */}
            <div style={{display: 'flex', gap: '45px', marginTop: '25px'}}>
                <button style={skipButtonStyle} onClick={() => {
                    setPosition(-1500);
                    setMessage("✕ Skipped!")
                    handleAction("dislike") }}>
                    ✕ Skip
                </button>
                <button style={likeButtonStyle} onClick={() => {
                    setPosition(1500);
                    setMessage("♥ Liked!")
                    handleAction("like") }}>
                    ♥ Like
                </button>
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

export default SwipeScreen
