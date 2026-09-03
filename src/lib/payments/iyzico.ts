import "server-only";
import Iyzipay from "iyzipay";

// Faz 2 (Ödeme) iskeleti (2026-09-03, kullanıcı onaylı — bkz. CLAUDE.md
// "eksikler" envanteri madde 1). Bu dosya sadece iyzico'nun "Checkout
// Form" (barındırılan ödeme sayfası) akışını sarmalıyor — kart bilgisi
// HİÇBİR ZAMAN bizim sunucumuza/kodumuza uğramıyor, kullanıcı doğrudan
// iyzico'nun kendi sayfasında kart giriyor, biz sadece init/retrieve
// çağırıp sonucu okuyoruz. Claude/Pexels API anahtarlarıyla AYNI kural:
// "server-only", anahtar client'a asla gönderilmiyor.
//
// Gerçek IYZICO_API_KEY/IYZICO_SECRET_KEY .env.local'da tanımlı DEĞİL —
// bu kullanıcının kendi iyzico mağaza hesabı açıp panelden alacağı,
// benim üretemeyeceğim bir kimlik bilgisi (Google OAuth kurulumuyla AYNI
// desen, bkz. CLAUDE.md bölüm 9). `isIyzicoConfigured()` false dönerken
// checkout route'u kullanıcıya nazik bir "ödeme altyapısı henüz aktif
// değil" mesajı döndürüyor, hiçbir yerde çökmüyor.
const API_KEY = process.env.IYZICO_API_KEY;
const SECRET_KEY = process.env.IYZICO_SECRET_KEY;
// iyzico varsayılan olarak SANDBOX (test) ortamını kullanıyor — gerçek
// para hareketi için kullanıcının kendi panelinden canlı URI'ye
// (api.iyzipay.com) bilinçli olarak geçmesi gerekiyor.
const BASE_URL = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";

export function isIyzicoConfigured(): boolean {
  return Boolean(API_KEY && SECRET_KEY);
}

function getClient(): Iyzipay {
  if (!isIyzicoConfigured()) {
    throw new Error("iyzico yapılandırılmamış (IYZICO_API_KEY/IYZICO_SECRET_KEY eksik).");
  }
  return new Iyzipay({ apiKey: API_KEY!, secretKey: SECRET_KEY!, uri: BASE_URL });
}

export interface CheckoutBuyer {
  id: string;
  name: string;
  surname: string;
  email: string;
  identityNumber: string;
  ip: string;
  city?: string;
  country?: string;
  registrationAddress?: string;
}

export interface InitializeCheckoutFormParams {
  conversationId: string;
  price: number;
  basketId: string;
  planLabel: string;
  callbackUrl: string;
  buyer: CheckoutBuyer;
}

export interface CheckoutFormInitResult {
  token: string;
  checkoutFormContent: string;
}

// iyzico'nun REST API'sindeki gerçek "Checkout Form Initialize" gövdesi
// (locale/conversationId/price/paidPrice/currency/basketId/paymentGroup/
// callbackUrl/buyer/shippingAddress/billingAddress/basketItems) —
// @types/iyzipay bu uç noktayı yanlışlıkla direkt-ödeme tipiyle
// (`paymentCard`/`installments` ZORUNLU) modelliyor, gerçek Checkout Form
// API'si bunları hiç istemiyor (kart bilgisi iyzico'nun kendi sayfasında
// giriliyor) — bu yüzden burada kendi, doğru gövde tipimiz kullanılıp
// çağrı noktasında iyzipay'in (yanlış) tipine cast ediliyor.
interface CheckoutFormInitializeRequestBody {
  locale: string;
  conversationId: string;
  price: string;
  paidPrice: string;
  currency: string;
  basketId: string;
  paymentGroup: string;
  callbackUrl: string;
  enabledInstallments: number[];
  buyer: {
    id: string;
    name: string;
    surname: string;
    gsmNumber?: string;
    email: string;
    identityNumber: string;
    registrationAddress: string;
    ip: string;
    city: string;
    country: string;
  };
  shippingAddress: { contactName: string; city: string; country: string; address: string };
  billingAddress: { contactName: string; city: string; country: string; address: string };
  basketItems: Array<{ id: string; name: string; category1: string; itemType: string; price: string }>;
}

export function initializeCheckoutForm(params: InitializeCheckoutFormParams): Promise<CheckoutFormInitResult> {
  const client = getClient();
  const priceStr = params.price.toFixed(2);

  const request: CheckoutFormInitializeRequestBody = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: params.conversationId,
    price: priceStr,
    paidPrice: priceStr,
    currency: Iyzipay.CURRENCY.TRY,
    basketId: params.basketId,
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    callbackUrl: params.callbackUrl,
    enabledInstallments: [1],
    buyer: {
      id: params.buyer.id,
      name: params.buyer.name,
      surname: params.buyer.surname,
      email: params.buyer.email,
      identityNumber: params.buyer.identityNumber,
      registrationAddress: params.buyer.registrationAddress || "Türkiye",
      ip: params.buyer.ip,
      city: params.buyer.city || "Istanbul",
      country: params.buyer.country || "Turkey",
    },
    shippingAddress: {
      contactName: `${params.buyer.name} ${params.buyer.surname}`,
      city: params.buyer.city || "Istanbul",
      country: params.buyer.country || "Turkey",
      address: params.buyer.registrationAddress || "Türkiye",
    },
    billingAddress: {
      contactName: `${params.buyer.name} ${params.buyer.surname}`,
      city: params.buyer.city || "Istanbul",
      country: params.buyer.country || "Turkey",
      address: params.buyer.registrationAddress || "Türkiye",
    },
    basketItems: [
      {
        id: params.basketId,
        name: params.planLabel,
        category1: "Abonelik",
        itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
        price: priceStr,
      },
    ],
  };

  return new Promise((resolve, reject) => {
    client.checkoutFormInitialize.create(
      request as unknown as Parameters<typeof client.checkoutFormInitialize.create>[0],
      (err, result) => {
        if (err) return reject(err);
        if (result.status !== "success") {
          return reject(new Error(`iyzico init başarısız: ${JSON.stringify(result)}`));
        }
        resolve({ token: result.token, checkoutFormContent: result.checkoutFormContent });
      }
    );
  });
}

export interface CheckoutFormRetrieveResult {
  status: string;
  paymentStatus: string;
  paymentId: string | undefined;
  price: number | string;
  paidPrice: number | string;
  basketId: string;
}

export function retrieveCheckoutForm(token: string, conversationId: string): Promise<CheckoutFormRetrieveResult> {
  const client = getClient();
  return new Promise((resolve, reject) => {
    client.checkoutForm.retrieve({ locale: Iyzipay.LOCALE.TR, conversationId, token }, (err, result) => {
      if (err) return reject(err);
      resolve({
        status: result.status,
        paymentStatus: result.paymentStatus,
        paymentId: result.paymentId,
        price: result.price,
        paidPrice: result.paidPrice,
        basketId: result.basketId,
      });
    });
  });
}
