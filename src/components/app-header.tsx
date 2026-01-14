'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from './logo';
import { MainNav } from './main-nav';
import { UserNav } from './user-nav';
import { Button } from './ui/button';
import { useSession } from '@/hooks/use-session';
import { Menu } from 'lucide-react';

export default function AppHeader() {
  const { user } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
         <header className="bg-black p-1 border-b border-gray-800 flex justify-between items-center sticky top-0 z-50">
      <div className="container flex h-16 items-center">
        <Logo />
        <div className="md:hidden ml-auto">
            <Button variant="ghost" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle navigation menu">
                <Menu className="h-6 w-6" />
            </Button>
        </div>
        <div className="hidden md:flex items-center space-x-4 ml-auto">
            <MainNav />
            <Link href="/profile" className="text-sm font-bold text-gray-400 hover:text-yellow-400">
                MI PERFIL
            </Link>
          {user ? (
            <UserNav user={user} />
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
        {isMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-black border-b border-gray-800 p-4">
                <MainNav onLinkClick={handleLinkClick} />
                <div className="flex flex-col space-y-2 mt-4">
                    <Link href="/profile" className="text-sm font-bold text-gray-400 hover:text-yellow-400" onClick={handleLinkClick}>
                        MI PERFIL
                    </Link>
                    {user ? (
                        <UserNav user={user} />
                    ) : (
                        <>
                            <Button variant="ghost" asChild>
                                <Link href="/login" onClick={handleLinkClick}>Log In</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/register" onClick={handleLinkClick}>Sign Up</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        )}
      </div>
      </header>

  );
}

 
         {/*} <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Logo />
        <MainNav />
        <div className="ml-auto flex items-center space-x-4">
          {user ? (
            <UserNav user={user} />
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>*/}
          