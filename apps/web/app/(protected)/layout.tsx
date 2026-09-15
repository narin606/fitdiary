import { ProtectedRoute } from "../../components/ProtectedRoute";
import { ProductNav } from "../../components/ProductNav";
export default function ProtectedLayout({children}:{children:React.ReactNode}){return <ProtectedRoute><ProductNav/>{children}</ProtectedRoute>}
