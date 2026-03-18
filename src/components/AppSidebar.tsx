import { FileText, Clock, FolderOpen, ChevronDown } from "lucide-react";
import { Account } from "@/types/document";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  accounts: Account[];
  selectedAccount: string;
  onSelectAccount: (account: string) => void;
}

export function AppSidebar({ accounts, selectedAccount, onSelectAccount }: AppSidebarProps) {
  return (
    <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col shrink-0">
      <div className="p-5 border-b border-sidebar-border">
        <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-5 w-5 text-sidebar-primary" />
          DocIntel
        </h1>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        <SidebarItem
          icon={<FolderOpen className="h-4 w-4" />}
          label="All Documents"
          count={accounts[0]?.documentCount}
          active={selectedAccount === "All Documents"}
          onClick={() => onSelectAccount("All Documents")}
        />
        <SidebarItem
          icon={<Clock className="h-4 w-4" />}
          label="Recent Uploads"
          active={selectedAccount === "Recent Uploads"}
          onClick={() => onSelectAccount("Recent Uploads")}
        />

        <div className="pt-5 pb-2 px-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
            Accounts
          </span>
        </div>

        {accounts.slice(1).map((account) => (
          <SidebarItem
            key={account.name}
            label={account.name}
            count={account.documentCount}
            active={selectedAccount === account.name}
            onClick={() => onSelectAccount(account.name)}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-muted">
          {accounts[0]?.documentCount} documents indexed
        </p>
      </div>
    </aside>
  );
}

function SidebarItem({
  icon,
  label,
  count,
  active,
  onClick,
}: {
  icon?: React.ReactNode;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-100",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{label}</span>
      {count !== undefined && (
        <span className="ml-auto text-xs text-sidebar-muted">{count}</span>
      )}
    </button>
  );
}
