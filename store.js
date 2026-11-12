// Veri katmanı: her şey telefonda (localStorage) tek bir nesnede tutulur.
// İleride bulut eşitlemesi eklenirse yalnızca bu dosya değişir.
(function (g) {
  var ANAHTAR = 'fzs1';

  function bos() {
    return {
      surum: 1,
      profil: null,          // kurulumda dolar
      gunler: {},            // 'YYYY-MM-DD' -> { kayitlar: [], su: ml, egzersiz: [], ruh: 1-5, belirti: [] }
      sonlar: [],            // son eklenen yemekler (yemek nesnesi + son birim)
      favoriler: [],         // yemek nesneleri
      yemeklerim: [],        // kullanıcının kaydettiği yemekler / ürünler (barkodlu olabilir)
      kilolar: [],           // { tarih: 'YYYY-MM-DD', kg }
      olculer: [],           // { tarih, bel, kalca, gogus, kol, boyun }
      oruc: { plan: '16:8', basla: null, gecmis: [], haftaGunleri: [] },
      tarifler: [],          // kullanıcının kaydettiği (yapay zekâ) tarifleri
      alisveris: [],         // { id, ad, alindi }
      plan: null,            // yapay zekâ günlük öğün planı
      ayarlar: {
        suHedef: 2000, bardak: 250, ogunOran: { kahvalti: 25, ogle: 35, aksam: 30, ara: 10 },
        geminiAnahtar: '', geminiModel: 'gemini-flash-latest', yakilanEkle: true, kaloriElle: null
      }
    };
  }

  var veri = bos();
  var kayitHatasi = false;

  function yukle() {
    try {
      var s = localStorage.getItem(ANAHTAR);
      if (s) {
        var v = JSON.parse(s);
        var b = bos();
        veri = Object.assign(b, v);
        veri.ayarlar = Object.assign(b.ayarlar, v.ayarlar || {});
      }
    } catch (e) { veri = bos(); }
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
    return veri;
  }

  function kaydet() {
    try { localStorage.setItem(ANAHTAR, JSON.stringify(veri)); kayitHatasi = false; }
    catch (e) { kayitHatasi = true; }
  }

  function gun(anahtar) {
    if (!veri.gunler[anahtar]) veri.gunler[anahtar] = { kayitlar: [], su: 0 };
    var g = veri.gunler[anahtar];
    if (!g.egzersiz) g.egzersiz = [];
    if (!g.belirti) g.belirti = [];
    return g;
  }

  function gunOku(anahtar) {
    var g = veri.gunler[anahtar] || { kayitlar: [], su: 0 };
    return { kayitlar: g.kayitlar || [], su: g.su || 0, egzersiz: g.egzersiz || [], ruh: g.ruh || 0, belirti: g.belirti || [] };
  }

  function yeniId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // Yemek nesnesinin taşınabilir kopyası (liste sırası değişse de bozulmaz)
  function yemekKopya(y) {
    var k = { ad: y.ad, marka: y.marka || '', k: y.k, p: y.p, c: y.c, f: y.f, birimler: y.birimler || [], kaynak: y.kaynak || 'liste' };
    if (y.barkod) k.barkod = y.barkod;
    return k;
  }

  function sonaEkle(y, birim, adet) {
    var k = yemekKopya(y);
    k.sonBirim = birim; k.sonAdet = adet;
    veri.sonlar = veri.sonlar.filter(function (s) { return s.ad !== k.ad; });
    veri.sonlar.unshift(k);
    if (veri.sonlar.length > 30) veri.sonlar.length = 30;
  }

  function favoriMi(ad) {
    return veri.favoriler.some(function (f) { return f.ad === ad; });
  }

  function favoriDegistir(y) {
    if (favoriMi(y.ad)) veri.favoriler = veri.favoriler.filter(function (f) { return f.ad !== y.ad; });
    else veri.favoriler.unshift(yemekKopya(y));
    kaydet();
  }

  function disaAktar() {
    return JSON.stringify(veri, null, 1);
  }

  function iceAktar(metin) {
    var v = JSON.parse(metin);
    if (!v || typeof v !== 'object' || !v.gunler) throw new Error('Bu dosya bir yedek değil');
    var b = bos();
    veri = Object.assign(b, v);
    veri.ayarlar = Object.assign(b.ayarlar, v.ayarlar || {});
    kaydet();
  }

  function sifirla() {
    veri = bos();
    kaydet();
  }

  g.Depo = {
    yukle: yukle, kaydet: kaydet, gun: gun, gunOku: gunOku, yeniId: yeniId,
    sonaEkle: sonaEkle, favoriMi: favoriMi, favoriDegistir: favoriDegistir,
    disaAktar: disaAktar, iceAktar: iceAktar, sifirla: sifirla, yemekKopya: yemekKopya,
    get v() { return veri; },
    get hata() { return kayitHatasi; }
  };
})(this);
