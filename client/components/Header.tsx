import { useState, useEffect } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Safely get auth context with fallback
  let user = null;
  let signOut = async () => {};

  try {
    const auth = useAuth();
    user = auth.user;
    signOut = auth.signOut;
  } catch (error) {
    console.warn("Auth context not available in Header:", error);
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "Vision", href: "/vision" },
    { name: "About us", href: "/about" },
    { name: "Careers", href: "/careers" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-border-subtle"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <nav className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F9cb17e967f804ce2b909c6bc3232a9f0%2F8ee6d0821d4340c299bf526d740adcab?format=webp&width=200"
              alt="ASOCSEMI Logo"
              className="h-20 sm:h-24 lg:h-28 w-auto"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-foreground/80 hover:text-tech-blue transition-colors duration-200 text-sm lg:text-base"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 text-foreground/80 hover:text-tech-blue transition-colors duration-200"
                >
                  <User className="w-4 h-4" />
                  <span className="max-w-32 truncate">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card-bg border border-border-subtle rounded-lg shadow-lg py-2 z-50">
                    {user.email?.includes("admin") && (
                      <Link
                        to="/admin-dashboard"
                        className="block px-4 py-2 text-foreground/80 hover:text-tech-blue hover:bg-background/50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        signOut();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-foreground/80 hover:text-tech-blue hover:bg-background/50 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-card-bg border border-border-subtle rounded-lg mt-2 p-4 animate-fade-in-up">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-foreground/80 hover:text-tech-blue transition-colors duration-200 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              {user ? (
                <>
                  <div className="py-2 text-foreground/80 border-t border-border-subtle">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      <span className="truncate">
                        {user.user_metadata?.full_name || user.email}
                      </span>
                    </div>
                  </div>
                  {user.email?.includes("admin") && (
                    <Link
                      to="/admin-dashboard"
                      className="text-foreground/80 hover:text-tech-blue transition-colors duration-200 py-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left text-foreground/80 hover:text-tech-blue transition-colors duration-200 py-2 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
