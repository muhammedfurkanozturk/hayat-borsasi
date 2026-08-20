-- Hesap oluşturma sonrası "ilk alışkanlıklarını seç" ekranı için:
-- kullanıcının onboarding'i görüp görmediğini (hiçbir kategori seçmemiş
-- olsa bile) ayırt etmek için ayrı bir sütun gerekiyor — yoksa "0 kategori"
-- durumu onu sonsuza kadar onboarding'e geri gönderir, bu da "hiçbir şey
-- zorunlu değil" prensibiyle çelişir (bkz. CLAUDE.md bölüm 1).
alter table public.profiles
  add column onboarding_completed_at timestamptz;

-- Var olan kullanıcılar geriye dönük olarak onboarding ekranına
-- yönlendirilmesin.
update public.profiles
  set onboarding_completed_at = created_at
  where onboarding_completed_at is null;

notify pgrst, 'reload schema';
