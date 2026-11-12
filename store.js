// Veri katmanı: her şey telefonda (localStorage) tek bir nesnede tutulur.
// İleride bulut eşitlemesi eklenirse yalnızca bu dosya değişir.
(function (g) {
  var ANAHTAR = 'fzs1';

  function bos() {
    return {
      surum: 1,
      profil: null,          // kurulumda dolar
      gunler: {},            // 'YYYY-MM-DD' -> { kayitlar: [], su: ml }
      sonlar: [],            // son eklenen yemekler (yemek nesnesi + son birim)
      favoriler: [],         // yemek nesneleri
      kilolar: [],           // { tarih: 'YYYY-MM-DD', kg }
      ayarlar: { suHedef: 2000, bardak: 250, ogunOran: { kahvalti: 25, ogle: 35, aksam: 30, ara: 10 } }
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
    return veri.gunler[anahtar];
  }

  function gunOku(anahtar) {
    return veri.gunler[anahtar] || { kayitlar: [], su: 0 };
  }

  function yeniId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // Yemek nesnesinin taşınabilir kopyası (liste sırası değişse de bozulmaz)
  function yemekKopya(y) {
    return { ad: y.ad, marka: y.marka || '', k: y.k, p: y.p, c: y.c, f: y.f, birimler: y.birimler || [], kaynak: y.kaynak || 'liste' };
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
