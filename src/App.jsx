import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import { useAuthStore } from "./store/authStore.js";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Leads from "./pages/Leads.jsx";
import CreateLead from "./pages/CreateLead.jsx";
import LeadDetail from "./pages/LeadDetail.jsx";
import Quotations from "./pages/Quotations.jsx";
import ShareQuotation from "./pages/ShareQuotation.jsx";
import CreateQuotation from "./pages/CreateQuotation.jsx";
import QuotationPreview from "./pages/QuotationPreview.jsx";
import PriceList from "./pages/PriceList.jsx";
import ProductInformation from "./pages/ProductInformation.jsx";
import TenderReference from "./pages/TenderReference.jsx";
import EmdBgEpbg from "./pages/EmdBgEpbg.jsx";
import Contacts from "./pages/Contacts.jsx";
import ContactsList from "./pages/ContactsList.jsx";
import MailMarketing from "./pages/MailMarketing.jsx";
import SupportDashboard from "./pages/SupportDashboard.jsx";
import SupportDetails from "./pages/SupportDetails.jsx";
import AmcSupport from "./pages/AmcSupport.jsx";
import AmcSupportList from "./pages/AmcSupportList.jsx";
import PurchaseOrder from "./pages/PurchaseOrder.jsx";
import Placeholder from "./pages/Placeholder.jsx";

function App() {
  const fetchMe = useAuthStore((state) => state.fetchMe);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Placeholder title="Dashboard" />} />
          <Route path="/sales/leads" element={<Leads />} />
          <Route path="/sales/leads/create" element={<CreateLead />} />
          <Route path="/sales/leads/:id" element={<LeadDetail />} />
          <Route path="/sales/leads/:id/product-info" element={<ProductInformation />} />
          <Route path="/sales/quotations" element={<Quotations />} />
          <Route path="/sales/quotations/new" element={<CreateQuotation />} />
          <Route path="/sales/share-quotation" element={<ShareQuotation />} />
          <Route path="/sales/quotations/:id/preview" element={<QuotationPreview />} />
          <Route path="/sales/products" element={<PriceList />} />
          <Route path="/sales/product-information" element={<ProductInformation />} />
          <Route path="/sales/tender-reference" element={<TenderReference />} />
          <Route path="/sales/emd-bg-epbg" element={<EmdBgEpbg />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/list" element={<ContactsList />} />
          <Route path="/contacts/mail-marketing" element={<MailMarketing />} />
          <Route path="/tasks" element={<Placeholder title="Tasks" />} />
          <Route path="/reports" element={<Placeholder title="Reports" />} />
          <Route path="/support/dashboard" element={<SupportDashboard />} />
          <Route path="/support/details" element={<SupportDetails />} />
          <Route path="/support/amc" element={<AmcSupportList />} />
          <Route path="/support/amc/new" element={<AmcSupport />} />
          <Route path="/support/amc/:id" element={<AmcSupport />} />
          <Route path="/support/cmc" element={<Placeholder title="CMC" />} />
          <Route path="/operations/purchase-order" element={<PurchaseOrder />} />
          <Route path="/settings" element={<Placeholder title="Settings" />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
