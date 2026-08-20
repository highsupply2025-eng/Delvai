import { getPaddleEnvironment } from "@/lib/paddle";

export function PaymentTestModeBanner() {
  if (getPaddleEnvironment() !== "sandbox") return null;

  return (
    <div className="w-full border-b border-orange-300 bg-orange-100 px-4 py-2 text-center text-sm text-orange-800">
      جميع عمليات الدفع داخل المعاينة تجريبية.{" "}
      <a
        href="https://docs.lovable.dev/features/payments#test-and-live-environments"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium underline"
      >
        اقرأ المزيد
      </a>
    </div>
  );
}
