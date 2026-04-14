import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SwipeScreen from './SwipeScreen'
import SearchScreen from "./SearchScreen"
import WelcomePage from './WelcomePage'
import SignUp from './SignUp'
import Login from './Login'
import LikedSongs from './LikedSongs'
import SeedPreferences from './SeedPreferences'
import Friends from './Friends'
import Profile from './Profile'
import { AuthProvider } from './AuthContext'      // ADD
import ProtectedRoute from './ProtectedRoute'     // ADD

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* public — no login needed */}
                    <Route path="/" element={<WelcomePage />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/login" element={<Login />} />

                    {/* protected — must be logged in */}
                    <Route path="/swipe" element={<ProtectedRoute><SwipeScreen /></ProtectedRoute>} />
                    <Route path="/search" element={<ProtectedRoute><SearchScreen /></ProtectedRoute>} />
                    <Route path="/liked" element={<ProtectedRoute><LikedSongs /></ProtectedRoute>} />
                    <Route path="/seedprefs" element={<ProtectedRoute><SeedPreferences /></ProtectedRoute>} />
                    <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    )
}

export default App