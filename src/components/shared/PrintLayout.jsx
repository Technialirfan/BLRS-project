import { useEffect } from "react";
import { Button } from "../ui/button";

const PrintLayout = ({ children, title = "Print", autoPrint = false }) => {
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => window.print(), 350);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoPrint]);

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="no-print mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{title}</h1>
        <Button onClick={() => window.print()}>Print</Button>
      </div>
      <div className="print-content">{children}</div>
    </div>
  );
};

export default PrintLayout;
