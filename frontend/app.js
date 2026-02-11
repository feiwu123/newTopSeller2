import { initDashboardPage } from "./pages/dashboard.js?v=2026-01-21-6";
import { initLoginPage } from "./pages/login.js?v=2026-01-10-10";
import { initOrderItemPage } from "./pages/orderItem.js?v=2026-01-10-10";

const page = document.body?.dataset?.page;

if (page === "login") initLoginPage();
if (page === "dashboard") initDashboardPage();
if (page === "order-item") initOrderItemPage();
