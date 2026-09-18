"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  LogOut,
  Menu,
  Plus,
  UserRound,
} from "lucide-react";
import { StarAfricaLogo } from "./star-africa-logo";
import { permittedNavigation } from "@/lib/security/navigation";
import { hasPermission } from "@/lib/security/permissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ShellUser = {
  name: string;
  role: string;
  position: string;
  permissions: readonly string[];
};

const quickCreate = [
  {
    label: "New bid opportunity",
    href: "/bids/opportunities/new",
    permission: "bids.create",
  },
  {
    label: "New project",
    href: "/projects/new",
    permission: "projects.create",
  },
  {
    label: "New customer",
    href: "/customers/new",
    permission: "customers.create",
  },
  {
    label: "New procurement request",
    href: "/procurement",
    permission: "procurement.create",
  },
  {
    label: "New invoice",
    href: "/invoices",
    permission: "invoices.create",
  },
  {
    label: "Record payment",
    href: "/payments",
    permission: "payments.create",
  },
  {
    label: "Upload document",
    href: "/documents/upload",
    permission: "documents.upload",
  },
  {
    label: "Scan receipt",
    href: "/documents/scan",
    permission: "documents.upload",
  },
];

export function AppShell({
  children,
  active,
  user,
}: {
  children: React.ReactNode;
  active: string;
  user: ShellUser;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      setCollapsed(
        localStorage.getItem("star-africa-sidebar-collapsed") === "true",
      ),
    );
    return () => cancelAnimationFrame(frame);
  }, []);
  const setPreference = (next: boolean) => {
    setCollapsed(next);
    localStorage.setItem("star-africa-sidebar-collapsed", String(next));
  };
  const initials = useMemo(
    () =>
      user.name
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase(),
    [user.name],
  );
  const navigation = permittedNavigation(user.permissions);
  const creates = quickCreate.filter((item) =>
    hasPermission(user.permissions, item.permission),
  );
  const navSection = (system: boolean) =>
    navigation
      .filter((item) => Boolean(item.system) === system)
      .map((item) => {
        const Icon = item.icon;
        const selected =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const link = (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${selected ? "active" : ""}`}
            aria-current={selected ? "page" : undefined}
            onClick={() => setDrawerOpen(false)}
          >
            <Icon />
            <span>{item.label}</span>
            {!collapsed ? <ChevronRight className="nav-arrow" /> : null}
          </Link>
        );
        return collapsed ? (
          <Tooltip key={item.href}>
            <TooltipTrigger render={link} />
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ) : (
          link
        );
      });
  return (
    <div className={`app-shell ${collapsed ? "sidebar-is-collapsed" : ""}`}>
      <aside
        className={`sidebar ${collapsed ? "sidebar-collapsed" : ""} ${drawerOpen ? "sidebar-open" : ""}`}
        aria-label="Primary navigation"
      >
        <div className="sidebar-brand">
          <StarAfricaLogo
            size={collapsed ? "small" : "medium"}
            compact={collapsed}
            linked
          />
        </div>
        <button
          className="sidebar-collapse-control"
          onClick={() =>
            window.matchMedia("(max-width: 760px)").matches
              ? setDrawerOpen(false)
              : setPreference(!collapsed)
          }
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
        <nav className="nav-stack">
          <p className="nav-label">Workspace</p>
          {navSection(false)}
          {navigation.some((item) => item.system) ? (
            <>
              <p className="nav-label nav-label-spaced">System</p>
              {navSection(true)}
            </>
          ) : null}
        </nav>
        <div className="sidebar-footer">
          <div className="sync-dot" />
          <div>
            <strong>Star Africa OS</strong>
            <span>Secure workspace</span>
          </div>
        </div>
      </aside>
      {drawerOpen ? (
        <button
          className="sidebar-scrim"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}
      <main className="main-surface">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
            >
              <Menu />
            </button>
            <div className="breadcrumbs">
              <Link href="/">Star Africa</Link>
              <ChevronRight />
              <strong>{active}</strong>
            </div>
          </div>
          <div className="workspace-context">
            <span>STAR AFRICA OS</span>
            <strong>{active}</strong>
          </div>
          <div className="topbar-actions">
            {creates.length ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="quick-create-trigger">
                  <Plus />
                  <span>Quick create</span>
                  <ChevronDown />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Create a record</DropdownMenuLabel>
                    {creates.map((item) => (
                      <DropdownMenuItem
                        key={item.href}
                        render={<Link href={item.href} />}
                      >
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            <Link
              className="icon-button notification-button"
              href="/notifications"
              aria-label="Notifications"
            >
              <Bell />
              <span />
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="profile profile-button">
                <span className="avatar">{initials || "SA"}</span>
                <div>
                  <strong>{user.name}</strong>
                  <span>{user.position}</span>
                </div>
                <ChevronDown />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="account-menu">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <strong>{user.name}</strong>
                    <span>{user.position}</span>
                    <small>{user.role.replaceAll("_", " ")}</small>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem disabled>
                    <UserRound />
                    My profile
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/account/security" />}>
                    <KeyRound />
                    Change password
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <form action="/api/auth/logout" method="post">
                    <DropdownMenuItem
                      render={
                        <button
                          type="submit"
                          className="signout-menu-item"
                          aria-label="Sign out"
                        />
                      }
                    >
                      <LogOut />
                      Sign out
                    </DropdownMenuItem>
                  </form>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
