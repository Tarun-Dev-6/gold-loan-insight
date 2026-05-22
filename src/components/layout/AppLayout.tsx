import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";

export function AppLayout({ children, title }: { children: ReactNode; title: string }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="hidden md:block sticky top-0 h-screen">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 backdrop-blur px-4 md:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="md:hidden -ml-2 rounded-md p-2 text-foreground hover:bg-muted"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex-1">
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <span>Welcome,</span>
            <span className="font-medium text-foreground">{user?.full_name ?? user?.username}</span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}