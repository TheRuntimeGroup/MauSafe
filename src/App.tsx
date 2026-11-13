import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Index from "./pages/Index";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/scam-check" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        position="bottom-center"
        toastOptions={{
          classNames: {
            toast: "rounded-2xl border-[#D6E0D7] font-sans",
            title: "font-bold text-[#17332F]",
            description: "text-[#5B6D67]",
          },
        }}
      />
    </BrowserRouter>
  );
};

export default App;
