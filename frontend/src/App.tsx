import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SignInPage from './pages/SignInPage'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import ProtectedRoute from './components/ProtectedRoute'
import VocabularyPage from './pages/VocabularyPage'
import VocabularyDetailPage from './pages/VocabularyDetailPage'
import ChatPage from './pages/ChatPage'
import ChatDetailPage from "@/pages/ChatDetailPage.tsx";
import MediaPage from './pages/MediaPage';
import MediaDetailPage from './pages/MediaDetailPage.tsx';
import Layout from './components/Layout'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/signin" element={<SignInPage/>}/>
                <Route path="/landing" element={<LandingPage/>}/>
                <Route element={<ProtectedRoute><Layout/></ProtectedRoute>}>
                    <Route path="/dashboard" element={<DashboardPage/>}/>
                    <Route path="/vocabulary" element={<VocabularyPage/>}/>
                    <Route path="/vocabulary/:id" element={<VocabularyDetailPage/>}/>
                    <Route path="/chat" element={<ChatPage/>}/>
                    <Route path="/chat/:id" element={<ChatDetailPage/>}/>
                    <Route path="/media" element={<MediaPage/>}/>
                    <Route path="/media/:id" element={<MediaDetailPage/>}/>

                </Route>
                <Route path="*" element={<Navigate to="/landing"/>}/>
            </Routes>
        </BrowserRouter>
    )
}

export default App