// Tarifler: hazır tarifler, filtre, detay, günlüğe ekleme, alışveriş listesi, pişirme modu,
// yapay zekâ ile "Elimde ne var?" tarifi ve günlük öğün planı.
(function () {
  'use strict';
  var A = App, V = A.V, esc = A.esc, sayi = A.sayi, $ = A.$, S = A.S;

  var FILTRELER = ['Kahvaltı', 'Çorba', 'Ana yemek', 'Salata ve meze', 'Ara öğün', 'Tatlı', 'Vejetaryen', 'Vegan', 'Düşük karbonhidrat', 'Yüksek protein', 'Pratik'];
  var TERCIHLER = ['Vejetaryen', 'Düşük karbonhidrat', 'Yüksek protein', 'Pratik (20 dk)', 'Tatlı', 'Az malzemeli'];
  S.tarifSekme = 'hepsi'; S.tarifQ = ''; S.tarifFiltre = '';

  function tumTarifler() { return V().tarifler.concat(window.TARIFLER); }
  function tarifBul(id) { return tumTarifler().filter(function (r) { return r.id === id; })[0]; }
  function filtreUyar(r, f) {
    if (!f) return true;
    if (f === 'Vejetaryen') return r.et.indexOf('Vejetaryen') >= 0 || r.et.indexOf('Vegan') >= 0;
    return r.kat === f || r.et.indexOf(f) >= 0;
  }

  // ---------- sekme ----------
  A.sekmeHtml.tarifler = function () {
    var h = '<div class="sekme-sec" style="margin-bottom:12px">';
    [['hepsi', 'Tarifler'], ['benim', 'Tariflerim'], ['alisveris', 'Alışveriş']].forEach(function (x) {
      h += '<button class="' + (S.tarifSekme === x[0] ? 'secili' : '') + '" data-a="tarifSekme" data-v="' + x[0] + '">' + x[1] + (x[0] === 'alisveris' && V().alisveris.filter(function (a) { return !a.alindi; }).length ? ' (' + V().alisveris.filter(function (a) { return !a.alindi; }).length + ')' : '') + '</button>';
    });
    h += '</div>';

    if (S.tarifSekme === 'alisveris') return h + alisverisHtml();

    if (S.tarifSekme === 'hepsi') {
      h += '<div class="yz-kartlar"><button class="yz-kart" data-a="tarifYz"><span>✨</span><b>Elimde ne var?</b><small>Malzemeni yaz, yapay zekâ tarif önersin</small></button>' +
        '<button class="yz-kart" data-a="planAc"><span>📅</span><b>Bugünün öğün planı</b><small>Kalori hedefine göre bir günlük menü</small></button></div>';
      h += '<div class="arama" style="margin-top:12px">' + A.ik('ara') + '<input id="tarifAra" type="search" placeholder="Tarif ara…" value="' + esc(S.tarifQ) + '" autocomplete="off"></div>';
      h += '<div class="filtreler">' + FILTRELER.map(function (f) {
        return '<button class="' + (S.tarifFiltre === f ? 'secili' : '') + '" data-a="tarifFiltre" data-v="' + esc(f) + '">' + esc(f) + '</button>';
      }).join('') + '</div>';
    }
    h += '<div id="tarifListe">' + tarifListeHtml() + '</div>';
    return h;
  };

  function tarifListeHtml() {
    var l = S.tarifSekme === 'benim' ? V().tarifler : window.TARIFLER;
    if (S.tarifSekme === 'hepsi') {
      l = l.filter(function (r) { return filtreUyar(r, S.tarifFiltre); });
      if (S.tarifQ.trim()) {
        var q = Hesap.duz(S.tarifQ);
        l = l.filter(function (r) { return Hesap.duz(r.ad + ' ' + r.mal.join(' ')).indexOf(q) >= 0; });
      }
    }
    if (!l.length) {
      return '<div class="bos"><span class="em">' + (S.tarifSekme === 'benim' ? '📖' : '🔍') + '</span>' +
        (S.tarifSekme === 'benim' ? 'Henüz kayıtlı tarifin yok. "Elimde ne var?" ile yapay zekâya tarif ürettirip kaydedebilirsin.' : 'Bu aramaya uyan tarif yok.') + '</div>';
    }
    return '<div class="tarif-liste">' + l.map(function (r) {
      return '<button class="tarif-kart" data-a="tarifAc" data-v="' + esc(r.id) + '"><span class="tarif-em">' + r.em + '</span><span class="tarif-bilgi"><b>' + esc(r.ad) + '</b>' +
        '<span>' + sayi(r.k) + ' kcal · ' + r.sure + ' dk · ' + esc(r.kat) + '</span>' +
        '<span class="etiketler">' + r.et.slice(0, 3).map(function (e) { return '<i>' + esc(e) + '</i>'; }).join('') + '</span></span></button>';
    }).join('') + '</div>';
  }

  function alisverisHtml() {
    var l = V().alisveris;
    var h = '<div class="arama"><input id="alisYeni" type="text" placeholder="Listeye ekle… (ör. 1 kg domates)" enterkeyhint="done">' +
      '<button class="mini-arti" data-a="alisEkle" aria-label="Ekle">' + A.ik('arti') + '</button></div>';
    if (!l.length) return h + '<div class="bos"><span class="em">🛒</span>Liste boş. Bir tarifteki "Malzemeleri listeye ekle" ile de doldurabilirsin.</div>';
    h += '<section class="kart" style="margin-top:12px;padding-top:4px;padding-bottom:4px">';
    l.forEach(function (a) {
      h += '<button class="alis-satir' + (a.alindi ? ' alindi' : '') + '" data-a="alisTik" data-v="' + a.id + '"><span class="kutu' + (a.alindi ? ' secili' : '') + '">' + A.ik('tik') + '</span><span>' + esc(a.ad) + '</span></button>';
    });
    h += '</section>';
    if (l.some(function (a) { return a.alindi; })) h += '<button class="dugme ikincil" data-a="alisTemizle">Alınanları temizle</button>';
    return h;
  }

  // ---------- tarif detayı ----------
  A.sheetler.tarif = function (s) {
    var r = s.r, kayitli = V().tarifler.some(function (x) { return x.id === r.id; }), yz = r.id.indexOf('yz') === 0;
    var h = A.basHtml('', s.geri ? 'geri' : 'kapat') + '<div class="sheet-govde">';
    h += '<div class="detay-bas"><div class="tarif-em buyuk">' + r.em + '</div><h2>' + esc(r.ad) + '</h2><span>' + r.sure + ' dk · ' + r.por + ' porsiyonluk · ' + esc(r.kat) + '</span>' +
      '<div class="etiketler" style="justify-content:center;margin-top:8px">' + r.et.map(function (e) { return '<i>' + esc(e) + '</i>'; }).join('') + '</div></div>';
    h += '<div class="detay-kcal" style="margin-top:6px"><b>' + sayi(r.k) + '</b><span>kcal / porsiyon</span></div>';
    h += '<div class="detay-makro"><div class="c"><b>' + sayi(r.c, true) + ' g</b><span>Karbonhidrat</span></div><div class="p"><b>' + sayi(r.p, true) + ' g</b><span>Protein</span></div><div class="f"><b>' + sayi(r.f, true) + ' g</b><span>Yağ</span></div></div>';
    if (yz && !kayitli) h += '<button class="dugme ikincil" data-a="tarifKaydet" style="margin-top:14px">📖 Tariflerime kaydet</button>';
    h += '<div class="bolum-bas">Malzemeler</div><ul class="malzeme">' + r.mal.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>';
    h += '<button class="dugme ikincil" data-a="tarifAlis">🛒 Malzemeleri alışveriş listesine ekle</button>';
    h += '<div class="bolum-bas">Yapılışı</div><ol class="adimlar">' + r.adim.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ol>';
    h += '<button class="dugme ikincil" data-a="pisir">👩‍🍳 Pişirme modunu başlat</button>';
    h += '<div class="bolum-bas">Günlüğe ekle (bugün)</div><div class="ogun-sec">' + A.OGUNLER.map(function (o) {
      return '<button class="' + (s.ogun === o.id ? 'secili' : '') + '" data-a="ogunSec" data-v="' + o.id + '">' + o.em + ' ' + o.ad + '</button>';
    }).join('') + '</div>';
    h += '<div class="miktar" style="margin-top:10px"><input id="tarifPor" type="text" inputmode="decimal" value="' + String(s.por).replace('.', ',') + '"><span class="birim-yazi">porsiyon</span></div>';
    if (kayitli && yz) h += '<button class="dugme tehlike" data-a="tarifSil" style="margin-top:10px">' + A.ik('cop') + 'Tariflerimden sil</button>';
    h += '<p class="ipucu" style="text-align:center;margin-top:10px">' + (yz ? 'Yapay zekâ tarifi; besin değerleri tahminidir.' : 'Besin değerleri yaklaşıktır.') + '</p></div>';
    h += '<div class="sheet-alt"><button class="dugme" data-a="tarifGunluk">Günlüğe ekle</button></div>';
    return h;
  };
  A.giris.tarifPor = function (el) { A.S.sheet.por = el.value; };

  function tarifAc(r, geri) {
    var yeni = { tur: 'tarif', r: r, ogun: r.kat === 'Kahvaltı' ? 'kahvalti' : (r.kat === 'Ara öğün' || r.kat === 'Tatlı' ? 'ara' : 'aksam'), por: 1 };
    if (geri) A.sheetGec(yeni); else { A.S.sheet = yeni; A.sheetAc(); }
  }

  // ---------- pişirme modu ----------
  var kilit = null;
  function ekranAcikTut() {
    try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (k) { kilit = k; }).catch(function () {}); } catch (e) {}
  }
  A.kapanis.push(function (s) { if (s && s.tur === 'pisir' && kilit) { try { kilit.release(); } catch (e) {} kilit = null; } });
  A.sheetler.pisir = function (s) {
    var r = s.r, n = r.adim.length, i = s.adim;
    return A.basHtml(r.ad, 'geri') + '<div class="sheet-govde pisir">' +
      '<div class="pisir-sayac">Adım ' + (i + 1) + ' / ' + n + '</div>' +
      '<div class="ilerleme"><i style="width:' + ((i + 1) / n * 100).toFixed(0) + '%"></i></div>' +
      '<p class="pisir-metin">' + esc(r.adim[i]) + '</p>' +
      (i === 0 ? '<details class="ileri"><summary>Malzemeler</summary><ul class="malzeme">' + r.mal.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul></details>' : '') +
      '</div><div class="sheet-alt iki">' +
      '<button class="dugme ikincil" data-a="pisirAdim" data-v="-1"' + (i === 0 ? ' disabled' : '') + '>Önceki</button>' +
      (i < n - 1 ? '<button class="dugme" data-a="pisirAdim" data-v="1">Sonraki</button>' : '<button class="dugme" data-a="geri">Afiyet olsun! 🎉</button>') + '</div>';
  };

  // ---------- yapay zekâ: elimde ne var ----------
  A.sheetler.tarifYz = function (s) {
    var h = A.basHtml('Elimde ne var?', 'kapat') + '<div class="sheet-govde">';
    h += '<p class="ipucu">Evdeki malzemeleri yaz. Tuz, baharat, yağ gibi temel şeyleri yazmana gerek yok.</p>';
    h += '<textarea id="tarifMalzeme" rows="3" placeholder="ör. tavuk göğsü, kabak, yoğurt, bulgur">' + esc(s.malzeme) + '</textarea>';
    h += '<div class="ogun-sec">' + TERCIHLER.map(function (t) {
      return '<button class="' + (s.tercih.indexOf(t) >= 0 ? 'secili' : '') + '" data-a="tarifTercih" data-v="' + esc(t) + '">' + esc(t) + '</button>';
    }).join('') + '</div>';
    if (s.durum === 'yukleniyor') h += '<div class="yukleniyor"><span class="donen"></span>Tarif hazırlanıyor…</div>';
    else if (s.durum === 'hata') h += '<div class="bos"><span class="em">⚠️</span>' + esc(s.hata) + '</div>';
    h += '<button class="dugme" data-a="tarifUret" style="margin-top:14px"' + (s.durum === 'yukleniyor' ? ' disabled' : '') + '>' + A.ik('yz') + ' Tarif öner</button></div>';
    return h;
  };
  A.giris.tarifMalzeme = function (el) { A.S.sheet.malzeme = el.value; };

  function tarifIste(s) {
    var mg = Hesap.makroGram(A.anaHedef(), V().profil.makro);
    var istem = 'Elimdeki malzemeler: ' + s.malzeme + '. Tercihlerim: ' + (s.tercih.join(', ') || 'yok') + '. ' +
      'Günlük hedefi ' + A.anaHedef() + ' kcal (protein ' + mg.p + ' g) olan ve ' + ({ ver: 'kilo vermek', koru: 'kilosunu korumak', al: 'kilo almak' }[V().profil.hedef]) + ' isteyen biri için ' +
      'bu malzemelerin çoğunu kullanan, sağlıklı, Türk damak tadına uygun tek bir tarif öner. Tuz, baharat, su, az yağ, soğan, sarımsak gibi temel malzemeleri kullanabilirsin. ' +
      (s.onceki ? 'Daha önce "' + s.onceki + '" önerildi, farklı bir şey öner. ' : '') +
      'Besin değerleri porsiyon başına ve gerçekçi olsun. Yalnızca şu şemada JSON döndür: ' +
      '{"ad":"Türkçe tarif adı","em":"tek emoji","kat":"Kahvaltı|Çorba|Ana yemek|Salata ve meze|Ara öğün|Tatlı","sure":30,"por":2,"k":350,"p":25,"c":30,"f":12,"et":["Vejetaryen|Vegan|Düşük karbonhidrat|Yüksek protein|Pratik"],"mal":["miktarıyla malzeme"],"adim":["kısa adım"]}';
    return window.YZ.istek([{ text: istem }], 0.8);
  }
  function tarifDuzenle(j) {
    var sayiAl = function (x, v) { x = Number(x); return isNaN(x) || x < 0 ? v : x; };
    return {
      id: 'yz' + Depo.yeniId(), ad: String(j.ad || 'Tarif'), em: String(j.em || '🍽️').slice(0, 4), kat: String(j.kat || 'Ana yemek'),
      sure: Math.round(sayiAl(j.sure, 30)), por: Math.max(1, Math.round(sayiAl(j.por, 2))),
      k: Math.round(sayiAl(j.k, 0)), p: Hesap.yuvarla(sayiAl(j.p, 0)), c: Hesap.yuvarla(sayiAl(j.c, 0)), f: Hesap.yuvarla(sayiAl(j.f, 0)),
      et: Array.isArray(j.et) ? j.et.map(String).slice(0, 5) : [],
      mal: Array.isArray(j.mal) ? j.mal.map(String) : [], adim: Array.isArray(j.adim) && j.adim.length ? j.adim.map(String) : ['Tarif adımları gelmedi.']
    };
  }

  // ---------- yapay zekâ: günlük öğün planı ----------
  A.sheetler.plan = function (s) {
    var pl = V().plan, h = A.basHtml('Bugünün öğün planı', 'kapat') + '<div class="sheet-govde">';
    var guncel = pl && pl.tarih === A.bugun();
    if (s.durum === 'yukleniyor') return h + '<div class="yukleniyor"><span class="donen"></span>Plan hazırlanıyor…</div></div>';
    if (s.durum === 'hata') h += '<div class="bos"><span class="em">⚠️</span>' + esc(s.hata) + '</div>';
    if (guncel) {
      var top = 0;
      pl.ogunler.forEach(function (o, oi) {
        var t = 0; o.yemekler.forEach(function (y) { t += window.YZ.kalemKcal(y); }); top += t;
        h += '<section class="kart"><div class="kart-ust"><h3 class="kart-bas">' + esc(A.ogunAd(o.ogun)) + '</h3><span class="ipucu">' + sayi(t) + ' kcal</span></div>';
        o.yemekler.forEach(function (y) {
          h += '<div class="kayit"><span class="ad"><b>' + esc(y.ad) + '</b><span>' + esc(A.miktarYazi(y.birim, y.adet)) + '</span></span><span class="kcal">' + sayi(window.YZ.kalemKcal(y)) + '</span></div>';
        });
        h += '<button class="kucuk-dugme" data-a="planOgunEkle" data-v="' + oi + '" style="margin-top:10px">' + A.ik('arti') + 'Günlüğe ekle</button></section>';
      });
      h += '<p class="ipucu" style="text-align:center">Toplam ' + sayi(top) + ' kcal · hedef ' + sayi(A.anaHedef()) + ' kcal' + (pl.not ? '<br>' + esc(pl.not) : '') + '</p>';
    } else {
      h += '<p class="ipucu">Yapay zekâ, ' + sayi(A.anaHedef()) + ' kcal hedefine göre Türk mutfağından bir günlük menü hazırlar. İstersen tercihini yaz.</p>';
    }
    h += '<div class="form-alan" style="margin-top:10px"><label for="planTercih">Tercih (isteğe bağlı)</label><input id="planTercih" type="text" placeholder="ör. balık sevmem, öğlen dışarıda yiyorum" value="' + esc(s.tercih || (pl && pl.tercih) || '') + '"></div>';
    h += '<button class="dugme' + (guncel ? ' ikincil' : '') + '" data-a="planUret">' + A.ik('yz') + (guncel ? ' Yeni plan oluştur' : ' Plan oluştur') + '</button></div>';
    return h;
  };
  A.giris.planTercih = function (el) { A.S.sheet.tercih = el.value; };

  function planIste(tercih) {
    var p = V().profil, k = A.anaHedef(), mg = Hesap.makroGram(k, p.makro), o = V().ayarlar.ogunOran;
    var istem = 'Günlük hedef ' + k + ' kcal; karbonhidrat ' + mg.c + ' g, protein ' + mg.p + ' g, yağ ' + mg.f + ' g. Hedef: ' + ({ ver: 'kilo vermek', koru: 'kiloyu korumak', al: 'kilo almak' }[p.hedef]) + '. ' +
      'Öğün dağılımı: kahvaltı %' + o.kahvalti + ', öğle %' + o.ogle + ', akşam %' + o.aksam + ', ara öğün %' + o.ara + '. Tercih: ' + (tercih || 'yok') + '. ' +
      'Türk mutfağından, evde kolayca hazırlanabilecek, doyurucu ve dengeli bir günlük plan hazırla. ' + window.YZ.KURAL.replace(/Yalnızca bu şemada JSON döndür: .*$/, '') +
      'Yalnızca şu şemada JSON döndür: {"ogunler":[{"ogun":"kahvalti|ogle|aksam|ara","yemekler":[{"ad":"","birim":"","adet":1,"gram":100,"k100":0,"p100":0,"c100":0,"f100":0}]}],"not":"kısa ipucu"}';
    return window.YZ.istek([{ text: istem }], 0.7);
  }

  // ---------- olaylar ----------
  var aks = A.aks;
  aks.tarifSekme = function (el) { S.tarifSekme = el.dataset.v; A.render(); };
  aks.tarifFiltre = function (el) {
    S.tarifFiltre = S.tarifFiltre === el.dataset.v ? '' : el.dataset.v;
    el.parentNode.querySelectorAll('button').forEach(function (b) { b.classList.toggle('secili', b.dataset.v === S.tarifFiltre); });
    $('tarifListe').innerHTML = tarifListeHtml();
  };
  A.giris.tarifAra = function (el) { S.tarifQ = el.value; $('tarifListe').innerHTML = tarifListeHtml(); };
  aks.tarifAc = function (el) { var r = tarifBul(el.dataset.v); if (r) tarifAc(r); };
  aks.tarifGunluk = function () {
    var s = A.S.sheet, n = A.oku(s.por);
    if (!(n > 0)) { A.toast('Porsiyonu yaz'); return; }
    var r = s.r;
    var y = { ad: r.ad, k: r.k, p: r.p, c: r.c, f: r.f, birimler: [{ ad: 'porsiyon', g: 100 }], kaynak: 'tarif' };
    A.kayitYaz(y, s.ogun, 'porsiyon', n, null, A.bugun());
    A.render(); A.sheetKapat();
    A.toast(r.ad + ' ' + A.ogunAd(s.ogun) + ' öğününe eklendi');
  };
  aks.tarifAlis = function () {
    var r = A.S.sheet.r, l = V().alisveris, n = 0;
    r.mal.forEach(function (m) {
      if (l.some(function (a) { return !a.alindi && a.ad === m; })) return;
      l.push({ id: Depo.yeniId(), ad: m, alindi: false }); n++;
    });
    A.kaydet(); A.toast(n ? n + ' malzeme alışveriş listesine eklendi' : 'Malzemeler zaten listede');
    if (A.S.sekme === 'tarifler') A.render();
  };
  aks.pisir = function () { A.sheetGec({ tur: 'pisir', r: A.S.sheet.r, adim: 0 }); ekranAcikTut(); };
  aks.pisirAdim = function (el) {
    var s = A.S.sheet; s.adim = Math.max(0, Math.min(s.r.adim.length - 1, s.adim + Number(el.dataset.v))); A.renderSheet();
  };
  aks.tarifKaydet = function () {
    var r = A.S.sheet.r;
    V().tarifler.unshift(r); A.kaydet(); A.renderSheet(); A.render();
    A.toast('Tariflerime kaydedildi');
  };
  aks.tarifSil = function () {
    var r = A.S.sheet.r;
    if (!confirm('"' + r.ad + '" silinsin mi?')) return;
    V().tarifler = V().tarifler.filter(function (x) { return x.id !== r.id; });
    A.kaydet(); A.sheetKapat(); A.render();
  };

  aks.tarifYz = function () {
    window.YZ.gerekli(function () {
      if (A.S.sheet) { A.sheetGec({ tur: 'tarifYz', malzeme: '', tercih: [] }); return; }
      A.S.sheet = { tur: 'tarifYz', malzeme: '', tercih: [] }; A.sheetAc();
    });
  };
  aks.tarifTercih = function (el) {
    var s = A.S.sheet, t = el.dataset.v, i = s.tercih.indexOf(t);
    if (i >= 0) s.tercih.splice(i, 1); else s.tercih.push(t);
    el.classList.toggle('secili', i < 0);
  };
  aks.tarifUret = function () {
    var s = A.S.sheet;
    if (!(s.malzeme || '').trim()) { A.toast('Önce malzemeleri yaz'); return; }
    s.durum = 'yukleniyor'; A.renderSheet();
    tarifIste(s).then(function (j) {
      if (A.S.sheet !== s) return;
      s.durum = ''; var r = tarifDuzenle(j); s.onceki = r.ad;
      tarifAc(r, true);
    }).catch(function (e) {
      if (A.S.sheet !== s) return;
      s.durum = 'hata'; s.hata = e.message; A.renderSheet();
    });
  };

  aks.planAc = function () {
    window.YZ.gerekli(function () { A.S.sheet = { tur: 'plan' }; A.sheetAc(); });
  };
  aks.planUret = function () {
    var s = A.S.sheet, tercih = ($('planTercih').value || '').trim();
    s.durum = 'yukleniyor'; A.renderSheet();
    planIste(tercih).then(function (j) {
      var ogunler = (j.ogunler || []).map(function (o) {
        var id = ['kahvalti', 'ogle', 'aksam', 'ara'].indexOf(o.ogun) >= 0 ? o.ogun : 'ara';
        return { ogun: id, yemekler: window.YZ.listeDuzenle({ yemekler: o.yemekler || [] }) };
      }).filter(function (o) { return o.yemekler.length; });
      if (!ogunler.length) throw new Error('Plan oluşturulamadı. Tekrar dene.');
      V().plan = { tarih: A.bugun(), ogunler: ogunler, not: j.not || '', tercih: tercih };
      A.kaydet();
      if (A.S.sheet === s) { s.durum = ''; A.renderSheet(); }
    }).catch(function (e) {
      if (A.S.sheet !== s) return;
      s.durum = 'hata'; s.hata = e.message; A.renderSheet();
    });
  };
  aks.planOgunEkle = function (el) {
    var o = V().plan.ogunler[Number(el.dataset.v)];
    var eski = A.S.tarih; A.S.tarih = A.bugun();
    o.yemekler.forEach(function (y) { window.YZ.kalemEkle(y, o.ogun); });
    A.S.tarih = eski;
    A.render();
    A.toast(A.ogunAd(o.ogun) + ': ' + o.yemekler.length + ' kalem günlüğe eklendi');
  };

  // alışveriş
  aks.alisTik = function (el) {
    var a = V().alisveris.filter(function (x) { return x.id === el.dataset.v; })[0];
    if (!a) return;
    a.alindi = !a.alindi; A.kaydet(); A.render();
  };
  aks.alisTemizle = function () { V().alisveris = V().alisveris.filter(function (a) { return !a.alindi; }); A.kaydet(); A.render(); };
  aks.alisEkle = function () {
    var g = $('alisYeni'), v = g.value.trim();
    if (!v) { g.focus(); return; }
    V().alisveris.push({ id: Depo.yeniId(), ad: v, alindi: false });
    A.kaydet(); A.render();
    g = $('alisYeni'); if (g) g.focus();
  };
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.target.id !== 'alisYeni') return;
    e.preventDefault();
    aks.alisEkle();
  });
})();
