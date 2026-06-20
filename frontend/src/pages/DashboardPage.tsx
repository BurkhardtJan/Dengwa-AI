import {useQuery} from '@tanstack/react-query'
import {useNavigate} from 'react-router-dom'
import {fetchMe} from '../services/user.service'

function DashboardPage() {
    const navigate = useNavigate()
    const {data, isLoading, isError} = useQuery({
        queryKey: ['me'],
        queryFn: fetchMe
    })


    if (isLoading) return <p className="p-8">Lädt...</p>
    if (isError) return <p className="p-8 text-red-500">Fehler beim Laden</p>

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Dashboard</h1>
            </div>
            <p className="text-muted-foreground">Willkommen, {data.username}!</p>
            <p className="text-muted-foreground">Muttersprache: {data.native_language}</p>
        </div>
    )
}

export default DashboardPage