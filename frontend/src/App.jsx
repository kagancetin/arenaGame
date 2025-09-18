import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AxiosProvider } from "./context/AxiosContext"
import { AuthProvider } from "./context/AuthContext"
import Layout from "./components/Layout"
import Home from "./pages/Home"
import Game from "./pages/Game"
import Leaderboard from "./pages/Leaderboard"
import PrivateRoute from "./components/auth/PrivateRoute"

function App() {
    return (
        <AuthProvider>
            <AxiosProvider>
                <Router>
                    <Routes>
                        <Route element={<Layout />}>
                            <Route path="/" element={<Home />} />
                            <Route path="/leaderboard" element={<Leaderboard />} />
                        </Route>

                        <Route
                            path="/game/*"
                            element={
                                <PrivateRoute>
                                    <Game />
                                </PrivateRoute>
                            }
                        />
                    </Routes>
                </Router>
            </AxiosProvider>
        </AuthProvider>
    )
}

export default App
