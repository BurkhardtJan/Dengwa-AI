import {Navigate} from 'react-router-dom'
import {authStorage} from '@/lib/authStorage'

function ProtectedRoute({children}: { children: React.ReactNode }) {
    const token = authStorage.getToken()

    if (!token) {
        return <Navigate to="/login"/>
    }

    return children
}

export default ProtectedRoute