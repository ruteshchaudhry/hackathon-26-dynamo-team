import React from "react";
import ReactDOM from "react-dom/client";
import { createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import { DemoSwitcher } from "@/components/demo-switcher";
import { useDemoState } from "@/lib/demo-store";
import { WeeklyReview } from "@/routes/index";
import { OutlookInbox } from "@/routes/outlook";
import { DynamicsApp } from "@/routes/dynamics";
import "./styles.css";

function Root() {
  const { resetCount } = useDemoState();
  return <><DemoSwitcher /><div key={resetCount} className="contents"><Outlet /></div></>;
}
const rootRoute = createRootRoute({ component: Root });
const capture = createRoute({ getParentRoute: () => rootRoute, path: "/", component: WeeklyReview });
const outlook = createRoute({ getParentRoute: () => rootRoute, path: "/outlook", component: OutlookInbox });
const dynamics = createRoute({ getParentRoute: () => rootRoute, path: "/dynamics", component: DynamicsApp });
const router = createRouter({ routeTree: rootRoute.addChildren([capture, outlook, dynamics]) });
declare module "@tanstack/react-router" { interface Register { router: typeof router } }
router.subscribe("onResolved", () => {
  document.title = router.state.location.pathname === "/outlook"
    ? "Outlook Inbox — Contact Capture"
    : router.state.location.pathname === "/dynamics"
      ? "Dynamics Contacts — Contact Capture"
      : "Weekly Contact Review — Contact Capture";
});
ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><RouterProvider router={router} /></React.StrictMode>);
