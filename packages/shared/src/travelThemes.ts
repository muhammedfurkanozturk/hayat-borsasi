// Seyahat kategorisi — temalı bucket list'ler. roadmapTemplates.ts /
// exerciseLibrary.ts ile aynı desen: statik, kürate edilmiş TS verisi,
// kullanıcı bir maddeyi işaretleyince sadece ilerleme (travel_bucket_progress)
// kaydediliyor, liste kendisi hiç DB'ye materialize edilmiyor.
//
// Kullanıcının isteğiyle BAŞLANGIÇ için sadece 2 örnek tema var — ileride
// yeni temalar (örn. "En Uzun Sahil Şeritleri", "Avrupa Başkentleri")
// eklenebilir. Liste eksiksiz/resmi bir kaynak değil, bilinen/kapsamlı bir
// başlangıç seti — kullanıcı yanlış/eksik bir madde fark ederse düzeltilebilir.
export interface TravelBucketItem {
  key: string;
  name: string;
  province?: string;
}

export interface TravelBucketTheme {
  key: string;
  title: string;
  description: string;
  items: TravelBucketItem[];
}

export const TRAVEL_BUCKET_THEMES: TravelBucketTheme[] = [
  {
    key: "unesco-tr",
    title: "UNESCO Dünya Mirası (Türkiye)",
    description: "Türkiye'deki UNESCO Dünya Mirası Listesi'ndeki alanlar.",
    items: [
      { key: "istanbul-tarihi-alanlari", name: "İstanbul'un Tarihi Alanları", province: "İstanbul" },
      { key: "goreme-kapadokya", name: "Göreme Milli Parkı ve Kapadokya Kaya Bölgeleri", province: "Nevşehir" },
      { key: "hattusa", name: "Hattuşa (Hitit Başkenti)", province: "Çorum" },
      { key: "nemrut-dagi", name: "Nemrut Dağı", province: "Adıyaman" },
      { key: "xanthos-letoon", name: "Xanthos-Letoon", province: "Antalya" },
      { key: "hierapolis-pamukkale", name: "Hierapolis-Pamukkale", province: "Denizli" },
      { key: "safranbolu", name: "Safranbolu Şehri", province: "Karabük" },
      { key: "truva", name: "Truva Arkeolojik Alanı", province: "Çanakkale" },
      { key: "selimiye-camii", name: "Selimiye Camii ve Külliyesi", province: "Edirne" },
      { key: "catalhoyuk", name: "Çatalhöyük Neolitik Kenti", province: "Konya" },
      { key: "bursa-cumalikizik", name: "Bursa ve Cumalıkızık", province: "Bursa" },
      { key: "pergamon", name: "Bergama Çok Katmanlı Kültürel Peyzajı", province: "İzmir" },
      { key: "diyarbakir-kalesi", name: "Diyarbakır Kalesi ve Hevsel Bahçeleri", province: "Diyarbakır" },
      { key: "efes", name: "Efes Antik Kenti", province: "İzmir" },
      { key: "ani", name: "Ani Arkeolojik Alanı", province: "Kars" },
      { key: "afrodisias", name: "Afrodisias", province: "Aydın" },
      { key: "gobeklitepe", name: "Göbeklitepe", province: "Şanlıurfa" },
      { key: "arslantepe", name: "Arslantepe Höyüğü", province: "Malatya" },
    ],
  },
  {
    key: "milli-parklar-tr",
    title: "Türkiye'nin Milli Parkları",
    description: "Bilinen, doğa yürüyüşü/kamp için popüler bir başlangıç seti — Türkiye'de bundan çok daha fazla milli park var.",
    items: [
      { key: "kazdaglari", name: "Kazdağları Milli Parkı", province: "Çanakkale" },
      { key: "kopru-kanyon", name: "Köprülü Kanyon Milli Parkı", province: "Antalya" },
      { key: "olympos-beydaglari", name: "Olympos Beydağları Milli Parkı", province: "Antalya" },
      { key: "kackar-daglari", name: "Kaçkar Dağları Milli Parkı", province: "Rize" },
      { key: "uludag", name: "Uludağ Milli Parkı", province: "Bursa" },
      { key: "dilek-yarimadasi", name: "Dilek Yarımadası - Büyük Menderes Deltası Milli Parkı", province: "Aydın" },
      { key: "kuscenneti", name: "Kuşcenneti Milli Parkı", province: "Balıkesir" },
      { key: "munzur-vadisi", name: "Munzur Vadisi Milli Parkı", province: "Tunceli" },
      { key: "yedigoller", name: "Yedigöller Milli Parkı", province: "Bolu" },
      { key: "altindere-vadisi", name: "Altındere Vadisi Milli Parkı (Sümela)", province: "Trabzon" },
    ],
  },
];
