// -----------------------------------------------------------------------
// App.jsx
// renders the app screen for now
// Authors: Lucille Rizo Patron, Eleanor Liu
// -----------------------------------------------------------------------

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SwipeScreen from './SwipeScreen'
import SearchScreen from "./SearchScreen"

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<SwipeScreen />} />
                <Route path="/search" element={<SearchScreen />} />
                <Route path="/search" element={<LikedSongs />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App