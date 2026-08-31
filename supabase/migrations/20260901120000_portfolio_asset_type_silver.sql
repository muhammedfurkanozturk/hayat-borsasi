-- Madde 5 (Sharesight ilhamı) — kıymetli maden portföy entegrasyonu.
-- portfolio_asset_type enum'ı şimdiye kadar sadece 'stock'/'gold' içeriyordu
-- ama PortfolioPanel'de altın/gümüş için gerçek bir "işlem ekle" akışı hiç
-- yoktu (asset_type='gold' tipte tanımlıydı ama kullanılmıyordu). Bu turda
-- hem altın hem gümüş gerçek pozisyon olarak eklenebiliyor (canlı gram
-- fiyatıyla, MarketWatchPanel'in zaten çektiği aynı veri kaynağından) —
-- gümüş için enum değeri eksikti.
alter type public.portfolio_asset_type add value if not exists 'silver';

notify pgrst, 'reload schema';
