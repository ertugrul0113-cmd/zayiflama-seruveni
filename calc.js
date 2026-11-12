// Hesaplamalar. Tarayıcıda window.Hesap, Node'da require ile kullanılır (test için).
(function (g) {
  var AKTIVITE = {
    az: { ad: 'Az hareketli', acik: 'Masa başı iş, spor yok', k: 1.2 },
    hafif: { ad: 'Hafif hareketli', acik: 'Haftada 1-3 gün spor veya ayakta iş', k: 1.375 },
    orta: { ad: 'Hareketli', acik: 'Haftada 3-5 gün spor', k: 1.55 },
    cok: { ad: 'Çok hareketli', acik: 'Her gün spor veya ağır iş', k: 1.725 }
  };

  // 1 kg yağ ≈ 7700 kcal → haftada 1 kg için günde 1100 kcal
  var KG_GUNLUK = 1100;

  function yas(dogumYili, bugun) {
    var y = (bugun || new Date()).getFullYear();
    return y - Number(dogumYili);
  }

  // Mifflin-St Jeor
  function bmr(p) {
    var b = 10 * p.kilo + 6.25 * p.boy - 5 * yas(p.dogumYili);
    return p.cinsiyet === 'erkek' ? b + 5 : b - 161;
  }

  function tdee(p) {
    return bmr(p) * (AKTIVITE[p.aktivite] || AKTIVITE.az).k;
  }

  function hedefKalori(p) {
    var t = tdee(p);
    var hiz = Number(p.hiz) || 0.5;
    var h = t;
    if (p.hedef === 'ver') h = t - hiz * KG_GUNLUK;
    else if (p.hedef === 'al') h = t + hiz * KG_GUNLUK;
    var alt = p.cinsiyet === 'erkek' ? 1500 : 1200;
    if (h < alt) h = alt;
    return Math.round(h / 10) * 10;
  }

  // oran: { c: karbonhidrat %, p: protein %, f: yağ % }
  function makroGram(kcal, oran) {
    return {
      c: Math.round(kcal * oran.c / 100 / 4),
      p: Math.round(kcal * oran.p / 100 / 4),
      f: Math.round(kcal * oran.f / 100 / 9)
    };
  }

  // Hedef kiloya tahmini kaç hafta
  function hedefHafta(p) {
    if (p.hedef === 'koru' || !p.hedefKilo) return 0;
    var fark = Math.abs(p.kilo - p.hedefKilo);
    return Math.ceil(fark / (Number(p.hiz) || 0.5));
  }

  // 100 g değerlerini verilen grama çevirir
  function besin(y, gram) {
    var o = gram / 100;
    return { k: Math.round(y.k * o), p: yuvarla(y.p * o), c: yuvarla(y.c * o), f: yuvarla(y.f * o) };
  }

  function yuvarla(x) { return Math.round(x * 10) / 10; }

  function topla(kayitlar) {
    var t = { k: 0, p: 0, c: 0, f: 0 };
    (kayitlar || []).forEach(function (e) { t.k += e.k; t.p += e.p; t.c += e.c; t.f += e.f; });
    t.p = yuvarla(t.p); t.c = yuvarla(t.c); t.f = yuvarla(t.f);
    return t;
  }

  function tarihAnahtar(d) {
    var a = d.getFullYear(), m = d.getMonth() + 1, g2 = d.getDate();
    return a + '-' + (m < 10 ? '0' : '') + m + '-' + (g2 < 10 ? '0' : '') + g2;
  }

  function anahtardanTarih(s) {
    var p = s.split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  // Türkçe harf farklarını yok sayan küçük harfe çevirme
  var HARF = { 'ı': 'i', 'İ': 'i', 'I': 'i', 'ş': 's', 'Ş': 's', 'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ö': 'o', 'Ö': 'o', 'ü': 'u', 'Ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u' };
  function duz(s) {
    return String(s || '').replace(/[ıİIşŞçÇğĞöÖüÜâîû]/g, function (h) { return HARF[h]; }).toLowerCase().trim();
  }

  // Basit puanlı arama: başta geçen > kelime başında geçen > içinde geçen
  function ara(liste, q, sinir) {
    var s = duz(q);
    if (!s) return [];
    var parcalar = s.split(/\s+/);
    var sonuc = [];
    liste.forEach(function (y) {
      var ad = duz(y.ad);
      var puan = 0;
      for (var i = 0; i < parcalar.length; i++) {
        var w = parcalar[i];
        var yer = ad.indexOf(w);
        if (yer < 0) return;
        if (yer === 0) puan += 3;
        else if (ad.charAt(yer - 1) === ' ' || ad.charAt(yer - 1) === '(') puan += 2;
        else puan += 1;
        var son = ad.charAt(yer + w.length);
        if (son === '' || son === ' ' || son === ')') puan += 1; // tam kelime
      }
      sonuc.push({ y: y, puan: puan, uz: ad.length });
    });
    sonuc.sort(function (a, b) { return b.puan - a.puan || a.uz - b.uz; });
    return sonuc.slice(0, sinir || 40).map(function (r) { return r.y; });
  }

  var Hesap = {
    AKTIVITE: AKTIVITE, yas: yas, bmr: bmr, tdee: tdee, hedefKalori: hedefKalori,
    makroGram: makroGram, hedefHafta: hedefHafta, besin: besin, topla: topla,
    tarihAnahtar: tarihAnahtar, anahtardanTarih: anahtardanTarih, duz: duz, ara: ara, yuvarla: yuvarla
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Hesap;
  else g.Hesap = Hesap;
})(this);
