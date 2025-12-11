
import Header from "@/components/Header";

const Layout = ({children}:{children: React.ReactNode}) => {
    return (
        <main className="min-h-screen">
            <Header/>
            <div className = "min-h-scren text-gray-400">
                {children}
            </div>
        </main>
    )
}
export default Layout
