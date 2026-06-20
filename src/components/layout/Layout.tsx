import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ReceiptPrintRoot from "@/components/ReceiptPrintRoot";

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-[1600px] px-6 py-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
      <ReceiptPrintRoot />
    </div>
  );
}
