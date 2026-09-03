"use client";

import { useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { XIcon } from "@/components/icons";

// iyzico'nun "Checkout Form" (barındırılan ödeme sayfası) akışı, init
// çağrısından dönen `checkoutFormContent` HAM HTML+<script> parçası
// olarak geliyor — iyzico'nun kendi script'i bunu bir <div
// id="iyzipay-checkout-form"> içine gömülü bir iframe/form'a dönüştürüyor.
// `dangerouslySetInnerHTML` script tag'lerini SESSİZCE ÇALIŞTIRMIYOR
// (tarayıcı güvenlik kısıtı) — bu yüzden içeriği koyduktan sonra <script>
// etiketlerini elle bulup YENİ script elemanları olarak yeniden ekliyoruz,
// bu standart "innerHTML'e gömülü script çalıştırma" tekniği.
export function IyzicoCheckoutModal({
  open,
  checkoutFormContent,
  onClose,
}: {
  open: boolean;
  checkoutFormContent: string | null;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !checkoutFormContent || !containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = checkoutFormContent;

    const scripts = Array.from(container.querySelectorAll("script"));
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
      newScript.textContent = oldScript.textContent;
      oldScript.replaceWith(newScript);
    });

    return () => {
      container.innerHTML = "";
    };
  }, [open, checkoutFormContent]);

  return (
    <Modal open={open} onClose={onClose} panelClassName="w-full max-w-lg rounded-lg border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-border-soft px-5 py-4">
        <span className="text-sm font-semibold text-foreground">Ödeme</span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-background-elevated hover:text-foreground"
        >
          <XIcon width={16} height={16} strokeWidth={2} />
        </button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto p-5">
        <div ref={containerRef} id="iyzipay-checkout-form-container" />
      </div>
    </Modal>
  );
}
