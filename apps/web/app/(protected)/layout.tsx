import { LogoutButton, ProtectedRoute } from "../../components/ProtectedRoute";
export default function ProtectedLayout({children}:{children:React.ReactNode}){return <ProtectedRoute><div className="session-control"><LogoutButton/></div>{children}</ProtectedRoute>}
