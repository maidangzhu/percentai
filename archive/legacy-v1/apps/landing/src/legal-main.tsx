import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LegalLayout } from "./pages/LegalLayout";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";
import "./styles.css";

const path = window.location.pathname;
const isTerms = path.endsWith("/terms") || path.endsWith("/terms.html");
const Page = isTerms ? TermsPage : PrivacyPage;
const title = isTerms
  ? "用户协议 / Terms of Service · Percent"
  : "隐私政策 / Privacy Policy · Percent";

document.title = title;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LegalLayout>
      <Page />
    </LegalLayout>
  </StrictMode>
);
