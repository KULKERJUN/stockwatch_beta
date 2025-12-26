'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {useRouter} from "next/navigation";
import { Button } from "./ui/button";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {LogOut, User, Bell} from "lucide-react";
import NavItems from "@/components/NavItems";
import {signOut} from "@/lib/actions/auth.actions";

const UserDropdown = ({user, initialStocks}:{user: User, initialStocks: StockWithWatchlistStatus[]}) => {
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push("/sign-in");
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 text-gray-4 hover:text-yellow-500">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://www.thesprucepets.com/thmb/Sp4CuorEpzsE130_eUqqKaClCuk=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/33351631_260594934684461_1144904437047754752_n-5b17d77604d1cf0037f3ea5a.jpg" />
                        <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                            {user.name[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                        <span className='text-base font-medium text-gray-400'>
                            {user.name}
                        </span>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>
                    <div className="flex relative items-center gap-3 py-2">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src="data:image/jpeg;base64,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" />
                            <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                                {user.name[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className='text-base font-medium text-gray-400'>
                                {user.name}
                            </span>
                            <span className="text-sm text-gray-500">{user.email}</span>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-600"/>
                <DropdownMenuItem 
                    onClick={() => router.push('/profile')} 
                    className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer"
                >
                    <User className="h-4 w-4 mr-2 hidden sm:block" />
                    Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-600"/>
                <DropdownMenuItem
                    onClick={() => router.push('/notifications')}
                    className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer"
                >
                    <Bell className="h-4 w-4 mr-2 hidden sm:block" />
                    Notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-600"/>
                <DropdownMenuItem onClick={handleSignOut} className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2 hidden sm:block" />
                    Logout
                </DropdownMenuItem>
                <DropdownMenuSeparator className="hidden sm:block bg-gray-600"/>
                <nav className="sm:hidden">
                    <NavItems initialStocks = {initialStocks}/>
                </nav>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
export default UserDropdown
