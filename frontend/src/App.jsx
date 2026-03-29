// -----------------------------------------------------------------------
// App.jsx
// renders the app screen for now
// Authors: Lucille Rizo Patron, Eleanor Liu
// -----------------------------------------------------------------------

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SwipeScreen from './SwipeScreen'
import SearchScreen from "./SearchScreen"
import WelcomePage from './WelcomePage'
import SignUp from './SignUp'
import Login from './Login'
import LikedSongs from './LikedSongs'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<WelcomePage />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />
                <Route path="/swipe" element={<SwipeScreen />} />
                <Route path="/search" element={<SearchScreen />} />
                <Route path="/liked" element={<LikedSongs />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App