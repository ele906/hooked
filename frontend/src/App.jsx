// -----------------------------------------------------------------------
// App.jsx
// renders the app screen for now
// Authors: Lucille Rizo Patron, Eleanor Liu
// -----------------------------------------------------------------------

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SwipeScreen from './SwipeScreen'
import SearchScreen from "./SearchScreen"
import WelcomePage from './WelcomePage'
import CreateAccount from './CreateAccount'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<WelcomePage />} />
                <Route path="/createAccount" element={<CreateAccount />} />
                <Route path="/swipe" element={<SwipeScreen />} />
                <Route path="/search" element={<SearchScreen />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App