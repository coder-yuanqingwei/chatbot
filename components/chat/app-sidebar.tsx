"use client";

import {
  ChevronDown,
  ChevronRight,
  Eye,
  MessageSquareIcon,
  PanelLeftIcon,
  PenSquareIcon,
  TrashIcon,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import {
  getChatHistoryPaginationKey,
  SidebarHistory,
} from "@/components/chat/sidebar-history";
import { SidebarUserNav } from "@/components/chat/sidebar-user-nav";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useI18n } from "@/lib/i18n/provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type SessionType = "chat" | "debate" | "roundtable" | "detective";

type ModuleConfig = {
  href: string;
  icon: typeof Eye;
  sessionType: SessionType;
  titleKey: string;
  newKey: string;
};

const MODULES: ModuleConfig[] = [
  {
    href: "/",
    icon: PenSquareIcon,
    newKey: "sidebar.new_chat",
    sessionType: "chat",
    titleKey: "sidebar.chat",
  },
  {
    href: "/debate",
    icon: TrendingUp,
    newKey: "sidebar.new_debate",
    sessionType: "debate",
    titleKey: "sidebar.debate",
  },
  {
    href: "/roundtable",
    icon: Users,
    newKey: "sidebar.new_roundtable",
    sessionType: "roundtable",
    titleKey: "sidebar.roundtable",
  },
  {
    href: "/detective",
    icon: Eye,
    newKey: "sidebar.new_detective",
    sessionType: "detective",
    titleKey: "sidebar.detective",
  },
];

const ALL_SESSION_TYPES: SessionType[] = [
  "chat",
  "debate",
  "roundtable",
  "detective",
];

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile, toggleSidebar } = useSidebar();
  const { mutate } = useSWRConfig();
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    chat: true,
    debate: false,
    detective: false,
    roundtable: false,
  });
  const { t } = useI18n();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) {
      return;
    }
    const activeModule = MODULES.find((mod) =>
      mod.href === "/" ? pathname === "/" : pathname.startsWith(mod.href)
    );
    if (activeModule) {
      setOpenSections((prev) => {
        if (prev[activeModule.sessionType]) {
          return prev;
        }
        return { ...prev, [activeModule.sessionType]: true };
      });
    }
  }, [pathname]);

  const closeMobile = useCallback(() => {
    setOpenMobile(false);
  }, [setOpenMobile]);

  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  const handleNewSession = useCallback(
    (href: string) => {
      setOpenMobile(false);
      router.push(href);
    },
    [router, setOpenMobile]
  );

  const isActiveRoute = useCallback(
    (href: string) =>
      href === "/" ? pathname === "/" : Boolean(pathname?.startsWith(href)),
    [pathname]
  );

  const handleToggleSection = useCallback((sessionType: SessionType) => {
    setOpenSections((prev) => ({
      ...prev,
      [sessionType]: !prev[sessionType],
    }));
  }, []);

  const handleShowDeleteAllDialog = useCallback(() => {
    setShowDeleteAllDialog(true);
  }, []);

  const handleDeleteAll = useCallback(() => {
    setShowDeleteAllDialog(false);
    router.replace("/");
    for (const sessionType of ALL_SESSION_TYPES) {
      mutate(
        unstable_serialize((index: number, prev: unknown) =>
          getChatHistoryPaginationKey(index, prev as never, sessionType)
        ),
        [],
        { revalidate: false }
      );
    }

    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`, {
      method: "DELETE",
    });

    toast.success(t("chat.slash.all_chats_deleted"));
  }, [mutate, router, t]);

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="pb-0 pt-3">
          <SidebarMenu>
            <SidebarMenuItem className="flex flex-row items-center justify-between">
              <div className="group/logo relative flex items-center justify-center">
                <SidebarMenuButton
                  asChild
                  className="size-8 px-0! items-center justify-center group-data-[collapsible=icon]:group-hover/logo:opacity-0"
                  tooltip="Chatbot"
                >
                  <Link href="/" onClick={closeMobile}>
                    <MessageSquareIcon className="size-4 text-sidebar-foreground/50" />
                  </Link>
                </SidebarMenuButton>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      className="pointer-events-none absolute inset-0 size-8 opacity-0 group-data-[collapsible=icon]:pointer-events-auto group-data-[collapsible=icon]:group-hover/logo:opacity-100"
                      onClick={handleToggleSidebar}
                    >
                      <PanelLeftIcon className="size-4" />
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent className="hidden md:block" side="right">
                    {t("sidebar.settings")}
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <SidebarTrigger className="text-sidebar-foreground/60 transition-colors duration-150 hover:text-sidebar-foreground" />
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="pt-1">
            <SidebarGroupContent>
              <SidebarMenu>
                {MODULES.map((mod) => (
                  <Collapsible
                    className="group/collapsible"
                    key={mod.sessionType}
                    onOpenChange={() => handleToggleSection(mod.sessionType)}
                    open={openSections[mod.sessionType] ?? false}
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          className="h-9 rounded-lg text-[13px] font-medium text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                          tooltip={t(mod.titleKey)}
                        >
                          <mod.icon className="size-4" />
                          <span>{t(mod.titleKey)}</span>
                          <ChevronRight className="ml-auto size-4 shrink-0 group-data-[state=open]/collapsible:hidden" />
                          <ChevronDown className="ml-auto size-4 shrink-0 hidden group-data-[state=open]/collapsible:flex" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                    </SidebarMenuItem>
                    <CollapsibleContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            className="h-8 rounded-lg text-[13px] transition-all duration-200 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground data-[active=true]:bg-primary/10 data-[active=true]:font-medium data-[active=true]:text-primary"
                            isActive={isActiveRoute(mod.href)}
                            onClick={() => handleNewSession(mod.href)}
                            tooltip={t(mod.newKey)}
                          >
                            <mod.icon className="ml-3 size-4" />
                            <span>{t(mod.newKey)}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        {mod.sessionType === "chat" && user ? (
                          <SidebarMenuItem>
                            <SidebarMenuButton
                              className="h-8 rounded-lg text-[13px] text-sidebar-foreground/40 transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive"
                              onClick={handleShowDeleteAllDialog}
                              tooltip={t("chat.slash.delete_all_confirm")}
                            >
                              <TrashIcon className="ml-3 size-4" />
                              <span>{t("chat.slash.delete_all_button")}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ) : null}
                      </SidebarMenu>
                      <SidebarHistory
                        sessionType={mod.sessionType}
                        user={user}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border pt-2 pb-3">
          {user ? <SidebarUserNav user={user} /> : null}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <AlertDialog
        onOpenChange={setShowDeleteAllDialog}
        open={showDeleteAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("chat.slash.delete_all_confirm")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("chat.slash.delete_all_warning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll}>
              {t("chat.slash.delete_all_button")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
