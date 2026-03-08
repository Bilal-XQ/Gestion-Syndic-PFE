"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[--border-subtle] bg-[--bg-base] px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-[--text-muted] hover:text-[--text-secondary] hover:bg-[--bg-card]" />
        <Separator
          orientation="vertical"
          className="mr-2 h-4 bg-[--border-subtle]"
        />
      </div>
    </header>
  );
}
