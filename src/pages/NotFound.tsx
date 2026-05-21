import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    const prevTitle = document.title;
    const prevDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') ?? null;
    document.title = "Page Not Found | Chromatic Daily";
    const descEl = document.querySelector('meta[name="description"]');
    if (descEl) descEl.setAttribute('content', 'The page you were looking for does not exist. Return to Chromatic Daily to play today\'s color memory game.');
    return () => {
      document.title = prevTitle;
      if (descEl && prevDesc !== null) descEl.setAttribute('content', prevDesc);
    };
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
