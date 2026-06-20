import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProtectedRoute from './components/ProtectedRoute'
import VocabularyPage from './pages/VocabularyPage'
import Layout from './components/Layout'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage/>}/>
                <Route element={<ProtectedRoute><Layout/></ProtectedRoute>}>
                    <Route path="/dashboard" element={<DashboardPage/>}/>
                    <Route path="/vocabulary" element={<VocabularyPage/>}/>
                </Route>
                <Route path="*" element={<Navigate to="/login"/>}/>
            </Routes>
        </BrowserRouter>
    )
}

export default App