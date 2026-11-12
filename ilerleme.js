// İlerleme: kilo grafiği, VKİ, haftalık kalori, ortalamalar, vücut ölçüleri, ruh hali, rozetler.
(function () {
  'use strict';
  var A = App, V = A.V, esc = A.esc, sayi = A.sayi, $ = A.$;

  var RUHLAR = ['😣', '😕', '😐', '🙂', '😄'];
  var BELIRTILER = ['Enerjik', 'Yorgun', 'Aç', 'Tok', 'Şişkinlik', 'Baş ağrısı', 'Tatlı krizi', 'İyi uyudum', 'Kötü uyudum', 'Stresli'];
  var OLCULER = [['bel', 'Bel'], ['kalca', 'Kalça'], ['gogus', 'Göğüs'], ['kol', 'Kol'], ['boyun', 'Boyun']];

  function sonGunler(n) {
    var l = [], k = A.bugun();
    for (var i = n - 1; i >= 0; i--) l.push(A.kaydir(k, -i));
    return l;
  }
  function gunVarMi(k) { var g = V().gunler[k]; return g && g.kayitlar && g.kayitlar.length; }

  // ---------- grafikler ----------
  function kiloGrafik() {
    var kl = V().kilolar, p = V().profil;
    if (kl.length < 2) return '<p class="ipucu" style="text-align:center;padding:18px 0">Grafik için en az iki kilo kaydı gerekiyor. Haftada bir tartılıp ekle.</p>';
    var l = kl.slice(-60);
    var W = 340, H = 170, sol = 34, sag = 8, ust = 12, alt = 24;
    var deg = l.map(function (x) { return x.kg; });
    if (p.hedefKilo) deg.push(p.hedefKilo);
    var mn = Math.floor(Math.min.apply(null, deg) - 1), mx = Math.ceil(Math.max.apply(null, deg) + 1);
    var t0 = Hesap.anahtardanTarih(l[0].tarih).getTime(), t1 = Hesap.anahtardanTarih(l[l.length - 1].tarih).getTime();
    var X = function (t) { return sol + (t1 === t0 ? 0.5 : (t - t0) / (t1 - t0)) * (W - sol - sag); };
    var Y = function (v) { return ust + (mx - v) / (mx - mn) * (H - ust - alt); };
    var s = '<svg class="grafik" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Kilo grafiği">';
    [mn, (mn + mx) / 2, mx].forEach(function (v) {
      s += '<line x1="' + sol + '" x2="' + (W - sag) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" class="izgara"/><text x="' + (sol - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" class="eksen">' + sayi(v) + '</text>';
    });
    if (p.hedefKilo) s += '<line x1="' + sol + '" x2="' + (W - sag) + '" y1="' + Y(p.hedefKilo) + '" y2="' + Y(p.hedefKilo) + '" class="hedef-cizgi"/><text x="' + (W - sag) + '" y="' + (Y(p.hedefKilo) - 5) + '" text-anchor="end" class="eksen hedef-yazi">hedef ' + sayi(p.hedefKilo, true) + '</text>';
    var yol = l.map(function (x, i) { return (i ? 'L' : 'M') + X(Hesap.anahtardanTarih(x.tarih).getTime()).toFixed(1) + ' ' + Y(x.kg).toFixed(1); }).join(' ');
    s += '<path d="' + yol + '" class="cizgi"/>';
    l.forEach(function (x, i) {
      if (l.length <= 20 || i === l.length - 1 || i === 0) s += '<circle cx="' + X(Hesap.anahtardanTarih(x.tarih).getTime()).toFixed(1) + '" cy="' + Y(x.kg).toFixed(1) + '" r="' + (i === l.length - 1 ? 4.5 : 3) + '" class="nokta"/>';
    });
    s += '<text x="' + sol + '" y="' + (H - 6) + '" class="eksen">' + A.kisaTarih(l[0].tarih) + '</text><text x="' + (W - sag) + '" y="' + (H - 6) + '" text-anchor="end" class="eksen">' + A.kisaTarih(l[l.length - 1].tarih) + '</text>';
    return s + '</svg>';
  }

  function kaloriGrafik(gunler) {
    var W = 340, H = 160, alt = 22, ust = 14;
    var veriler = gunler.map(function (k) { return { k: k, kcal: Hesap.topla(Depo.gunOku(k).kayitlar).k, hedef: A.gunHedef(k) }; });
    var mx = Math.max.apply(null, veriler.map(function (v) { return Math.max(v.kcal, v.hedef); })) * 1.1 || 1;
    var bw = W / gunler.length;
    var Y = function (v) { return ust + (1 - v / mx) * (H - ust - alt); };
    var s = '<svg class="grafik" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Haftalık kalori">';
    veriler.forEach(function (v, i) {
      var x = i * bw + bw * 0.22, w = bw * 0.56;
      if (v.kcal > 0) s += '<rect x="' + x.toFixed(1) + '" y="' + Y(v.kcal).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + (H - alt - Y(v.kcal)).toFixed(1) + '" rx="4" class="' + (v.kcal > v.hedef ? 'cubuk-asti' : 'cubuk-ok') + '"/>';
      s += '<line x1="' + (i * bw + 3).toFixed(1) + '" x2="' + ((i + 1) * bw - 3).toFixed(1) + '" y1="' + Y(v.hedef).toFixed(1) + '" y2="' + Y(v.hedef).toFixed(1) + '" class="hedef-cizgi"/>';
      var d = Hesap.anahtardanTarih(v.k);
      s += '<text x="' + (i * bw + bw / 2).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" class="eksen">' + A.GUN_KISA[d.getDay()] + '</text>';
      if (v.kcal > 0) s += '<text x="' + (i * bw + bw / 2).toFixed(1) + '" y="' + (Y(v.kcal) - 4).toFixed(1) + '" text-anchor="middle" class="eksen deger">' + sayi(v.kcal) + '</text>';
    });
    return s + '</svg>';
  }

  function ortalama(gunler) {
    var dolu = gunler.filter(gunVarMi), t = { k: 0, p: 0, c: 0, f: 0, su: 0, yak: 0 };
    dolu.forEach(function (k) {
      var g = Depo.gunOku(k), x = Hesap.topla(g.kayitlar);
      t.k += x.k; t.p += x.p; t.c += x.c; t.f += x.f;
    });
    gunler.forEach(function (k) { t.su += Depo.gunOku(k).su; t.yak += A.yakilan(k); });
    var n = dolu.length || 1;
    return { gun: dolu.length, k: t.k / n, p: t.p / n, c: t.c / n, f: t.f / n, su: t.su / gunler.length, yak: t.yak / gunler.length };
  }

  // ---------- rozetler ----------
  function rozetler() {
    var v = V(), p = v.profil, gunAnah = Object.keys(v.gunler).filter(gunVarMi).sort();
    var toplamKayit = 0; gunAnah.forEach(function (k) { toplamKayit += v.gunler[k].kayitlar.length; });
    var seri = 0, k = A.bugun();
    if (!gunVarMi(k)) k = A.kaydir(k, -1);
    while (gunVarMi(k)) { seri++; k = A.kaydir(k, -1); }
    var enUzun = 0, cur = 0, onceki = null;
    gunAnah.forEach(function (x) { cur = onceki && A.kaydir(onceki, 1) === x ? cur + 1 : 1; enUzun = Math.max(enUzun, cur); onceki = x; });
    var verilen = p.baslangic ? (p.hedef === 'al' ? p.kilo - p.baslangic.kg : p.baslangic.kg - p.kilo) : 0;
    var suGun = Object.keys(v.gunler).filter(function (x) { return (v.gunler[x].su || 0) >= v.ayarlar.suHedef; }).length;
    var oruclar = (v.oruc.gecmis || []).filter(function (x) { return (x.bitis - x.basla) / 3600e3 >= x.hedef; });
    var oruc16 = oruclar.filter(function (x) { return (x.bitis - x.basla) / 3600e3 >= 16; }).length;
    var egz = Object.keys(v.gunler).filter(function (x) { return (v.gunler[x].egzersiz || []).length; }).length;
    var hedefe = p.hedefKilo && (p.hedef === 'ver' ? p.kilo <= p.hedefKilo : p.hedef === 'al' ? p.kilo >= p.hedefKilo : false);
    return [
      ['🌱', 'İlk adım', 'İlk yemeğini kaydet', toplamKayit >= 1],
      ['🔥', '3 gün seri', '3 gün üst üste kayıt', enUzun >= 3],
      ['⚡', '7 gün seri', '7 gün üst üste kayıt', enUzun >= 7],
      ['🏆', '30 gün seri', '30 gün üst üste kayıt', enUzun >= 30],
      ['📒', '100 kayıt', '100 yemek kaydı', toplamKayit >= 100],
      ['⚖️', 'İlk kilo', p.hedef === 'al' ? '1 kg al' : '1 kg ver', verilen >= 1],
      ['🎯', '5 kilo', p.hedef === 'al' ? '5 kg al' : '5 kg ver', verilen >= 5],
      ['🥇', '10 kilo', p.hedef === 'al' ? '10 kg al' : '10 kg ver', verilen >= 10],
      ['💧', 'Su ustası', '7 gün su hedefi', suGun >= 7],
      ['⏱️', 'İlk oruç', 'Bir orucu tamamla', oruclar.length >= 1],
      ['🌙', '16 saat', '16 saatlik oruç', oruc16 >= 1],
      ['🏃', 'Hareketli', '10 gün egzersiz', egz >= 10],
      ['👑', 'Hedefe ulaştın', 'Hedef kiloya ulaş', !!hedefe]
    ].map(function (r) { return { em: r[0], ad: r[1], acik: r[2], var: r[3] }; }).concat([{ seri: seri }]);
  }
  window.Rozetler = rozetler;

  // ---------- sekme ----------
  A.sekmeHtml.ilerleme = function () {
    var p = V().profil, kl = V().kilolar, h = '';
    var bas = p.baslangic ? p.baslangic.kg : (kl[0] ? kl[0].kg : p.kilo);
    var fark = p.kilo - bas;
    // Kilo
    h += '<section class="kart"><div class="kart-ust"><h3 class="kart-bas">Kilo</h3><button class="kucuk-dugme" data-a="kiloEkle">' + A.ik('arti') + 'Kilo ekle</button></div>';
    h += '<div class="uc-deger"><div><span>Başlangıç</span><b>' + sayi(bas, true) + '</b></div><div><span>Şu an</span><b>' + sayi(p.kilo, true) + '</b></div><div><span>Hedef</span><b>' + (p.hedefKilo ? sayi(p.hedefKilo, true) : '—') + '</b></div></div>';
    if (fark) h += '<p class="degisim ' + ((p.hedef === 'al' ? fark > 0 : fark < 0) ? 'iyi' : 'kotu') + '">' + (fark < 0 ? '▼ ' : '▲ ') + sayi(Math.abs(fark), true) + ' kg ' + (fark < 0 ? 'verdin' : 'aldın') + '</p>';
    if (p.hedefKilo && p.hedef !== 'koru') {
      var top = Math.abs(p.hedefKilo - bas), yol = Math.abs(p.kilo - bas) * ((p.hedef === 'al' ? fark > 0 : fark < 0) ? 1 : 0);
      var yz = top ? Math.min(100, yol / top * 100) : 0;
      h += '<div class="makro" style="margin:10px 0"><div class="cubuk"><i style="width:' + yz.toFixed(0) + '%;background:var(--ana)"></i></div><div class="deger">Hedefin %' + Math.round(yz) + '\'i tamam</div></div>';
    }
    h += kiloGrafik() + '</section>';

    // VKİ
    var vki = p.kilo / Math.pow(p.boy / 100, 2);
    var kat = vki < 18.5 ? ['Zayıf', 'var(--yag)'] : vki < 25 ? ['Normal', 'var(--ana)'] : vki < 30 ? ['Fazla kilolu', 'var(--karb)'] : ['Obez', 'var(--uyari)'];
    var konum = Math.max(0, Math.min(100, (vki - 15) / (40 - 15) * 100));
    h += '<section class="kart"><div class="kart-ust"><h3 class="kart-bas">Vücut kitle indeksi</h3><b style="color:' + kat[1] + '">' + sayi(vki, true) + ' · ' + kat[0] + '</b></div>' +
      '<div class="vki-cubuk"><i style="left:' + konum.toFixed(0) + '%"></i></div><div class="vki-etiket"><span>15</span><span>18,5</span><span>25</span><span>30</span><span>40</span></div></section>';

    // Haftalık kalori
    var hafta = sonGunler(7), o7 = ortalama(hafta), o30 = ortalama(sonGunler(30));
    h += '<section class="kart"><div class="kart-ust"><h3 class="kart-bas">Son 7 gün kalori</h3><span class="ipucu">çizgi: hedef</span></div>' + kaloriGrafik(hafta);
    h += '<div class="bilgi-izgara"><div><span>7 gün ortalama</span><b>' + sayi(o7.k) + ' kcal</b></div><div><span>30 gün ortalama</span><b>' + sayi(o30.k) + ' kcal</b></div>' +
      '<div><span>Kayıtlı gün (30)</span><b>' + o30.gun + '</b></div><div><span>Ort. yakılan (7)</span><b>' + sayi(o7.yak) + ' kcal</b></div></div></section>';

    // Makro ortalama
    var mg = Hesap.makroGram(A.anaHedef(), p.makro);
    h += '<section class="kart"><h3 class="kart-bas">Ortalama makrolar (7 gün)</h3><div class="makrolar">' +
      mak('c', 'Karbonhidrat', o7.c, mg.c) + mak('p', 'Protein', o7.p, mg.p) + mak('f', 'Yağ', o7.f, mg.f) + '</div>' +
      '<p class="ipucu" style="margin-top:12px">💧 Ortalama su: ' + A.litre(o7.su) + ' L / gün</p></section>';

    // Ruh hali
    var g = Depo.gunOku(A.bugun());
    h += '<section class="kart"><h3 class="kart-bas">Bugün nasıl hissediyorsun?</h3><div class="ruh-sec">';
    RUHLAR.forEach(function (r, i) { h += '<button class="' + (g.ruh === i + 1 ? 'secili' : '') + '" data-a="ruh" data-v="' + (i + 1) + '">' + r + '</button>'; });
    h += '</div><div class="ogun-sec">';
    BELIRTILER.forEach(function (b) { h += '<button class="' + (g.belirti.indexOf(b) >= 0 ? 'secili' : '') + '" data-a="belirti" data-v="' + esc(b) + '">' + esc(b) + '</button>'; });
    h += '</div><div class="ruh-gecmis">';
    hafta.forEach(function (k) {
      var r = Depo.gunOku(k).ruh;
      h += '<div><span>' + (r ? RUHLAR[r - 1] : '·') + '</span><small>' + A.GUN_KISA[Hesap.anahtardanTarih(k).getDay()] + '</small></div>';
    });
    h += '</div></section>';

    // Ölçüler
    var ol = V().olculer, son = ol[ol.length - 1], ilk = ol[0];
    h += '<section class="kart"><div class="kart-ust"><h3 class="kart-bas">Vücut ölçüleri (cm)</h3><button class="kucuk-dugme" data-a="olcuEkle">' + A.ik('arti') + 'Ekle</button></div>';
    if (!son) h += '<p class="ipucu">Mezura ile ayda bir ölç. Kilo değişmese de santimetreler değişebilir.</p>';
    else {
      h += '<div class="bilgi-izgara">';
      OLCULER.forEach(function (x) {
        if (!son[x[0]]) return;
        var d = ilk && ilk !== son && ilk[x[0]] ? son[x[0]] - ilk[x[0]] : 0;
        h += '<div><span>' + x[1] + '</span><b>' + sayi(son[x[0]], true) + '</b>' + (d ? ' <small class="' + (d < 0 ? 'iyi' : 'kotu') + '">' + (d > 0 ? '+' : '') + sayi(d, true) + '</small>' : '') + '</div>';
      });
      h += '</div><p class="ipucu" style="margin-top:8px">Son ölçüm: ' + A.kisaTarih(son.tarih) + '</p>';
    }
    h += '</section>';

    // Rozetler
    var rz = rozetler(), seri = rz.pop().seri;
    h += '<section class="kart"><div class="kart-ust"><h3 class="kart-bas">Rozetler</h3><span class="ipucu">🔥 seri: ' + seri + ' gün</span></div><div class="rozetler">';
    rz.forEach(function (r) { h += '<div class="rozet' + (r.var ? ' var' : '') + '"><span>' + r.em + '</span><b>' + esc(r.ad) + '</b><small>' + esc(r.acik) + '</small></div>'; });
    h += '</div></section>';
    return h;
  };
  function mak(cls, ad, d, hd) {
    var o = hd ? Math.min(100, d / hd * 100) : 0;
    return '<div class="makro ' + cls + '"><div class="ad">' + ad + '</div><div class="cubuk"><i style="width:' + o.toFixed(0) + '%"></i></div><div class="deger">' + sayi(d) + ' / ' + hd + ' g</div></div>';
  }

  // ---------- çekmeceler ----------
  A.kisa.kilo = 1;
  A.sheetler.kilo = function () {
    var kl = V().kilolar.slice(-8).reverse();
    var h = A.basHtml('Kilo ekle', 'kapat') + '<div class="sheet-govde">' +
      '<div class="buyuk-giris" style="margin-top:6px"><input id="kiloYeni" type="text" inputmode="decimal" value="' + String(V().profil.kilo).replace('.', ',') + '"><span>kg</span></div>' +
      '<div class="form-alan" style="margin-top:16px"><label for="kiloTarih">Tarih</label><input id="kiloTarih" type="date" value="' + A.bugun() + '" max="' + A.bugun() + '"></div>' +
      '<p class="ipucu">Günlük kalori hedefin yeni kilona göre yeniden hesaplanır.</p>' +
      '<button class="dugme" data-a="kiloKaydet">Kaydet</button>';
    if (kl.length) {
      h += '<div class="bolum-bas">Son kayıtlar</div><div class="liste">';
      kl.forEach(function (x) {
        h += '<div class="yemek-satir"><span class="ad"><b>' + sayi(x.kg, true) + ' kg</b><span>' + A.tarihEtiket(x.tarih) + '</span></span><button class="mini-arti sil" data-a="kiloSil" data-v="' + x.tarih + '" aria-label="Sil">' + A.ik('cop') + '</button></div>';
      });
      h += '</div>';
    }
    return h + '</div>';
  };

  A.kisa.olcu = 1;
  A.sheetler.olcu = function () {
    var son = V().olculer[V().olculer.length - 1] || {};
    var h = A.basHtml('Ölçü ekle (cm)', 'kapat') + '<div class="sheet-govde"><div class="iki">';
    OLCULER.forEach(function (x) {
      h += '<div class="form-alan"><label for="olc_' + x[0] + '">' + x[1] + '</label><input id="olc_' + x[0] + '" type="text" inputmode="decimal" placeholder="' + (son[x[0]] ? String(son[x[0]]).replace('.', ',') : '') + '"></div>';
    });
    return h + '</div><button class="dugme" data-a="olcuKaydet">Kaydet</button></div>';
  };

  var aks = A.aks;
  aks.kiloEkle = function () { A.S.sheet = { tur: 'kilo' }; A.sheetAc(); };
  aks.kiloKaydet = function () {
    var kg = A.oku($('kiloYeni').value), t = $('kiloTarih').value || A.bugun();
    if (!(kg >= 30 && kg <= 300)) { A.toast('Geçerli bir kilo yaz'); return; }
    var eskiKalori = V().profil.kalori;
    A.profilKiloGuncelle(kg, t);
    A.sheetKapat(); A.render();
    var yeni = V().profil.kalori;
    A.toast('Kilo kaydedildi' + (yeni !== eskiKalori && !V().ayarlar.kaloriElle ? ' · yeni hedef ' + yeni + ' kcal' : ''));
  };
  aks.kiloSil = function (el) {
    var kl = V().kilolar;
    if (kl.length <= 1) { A.toast('Son kilo kaydı silinemez'); return; }
    V().kilolar = kl.filter(function (x) { return x.tarih !== el.dataset.v; });
    var p = V().profil; p.kilo = V().kilolar[V().kilolar.length - 1].kg; p.kalori = Hesap.hedefKalori(p);
    A.kaydet(); A.renderSheet(); A.render();
  };
  aks.olcuEkle = function () { A.S.sheet = { tur: 'olcu' }; A.sheetAc(); };
  aks.olcuKaydet = function () {
    var o = { tarih: A.bugun() }, n = 0;
    OLCULER.forEach(function (x) { var v = A.oku($('olc_' + x[0]).value); if (v > 0) { o[x[0]] = v; n++; } });
    if (!n) { A.toast('En az bir ölçü yaz'); return; }
    V().olculer = V().olculer.filter(function (x) { return x.tarih !== o.tarih; }).concat([o]);
    A.kaydet(); A.sheetKapat(); A.render(); A.toast('Ölçüler kaydedildi');
  };
  aks.ruh = function (el) {
    var g = Depo.gun(A.bugun()), v = Number(el.dataset.v);
    g.ruh = g.ruh === v ? 0 : v;
    A.kaydet(); A.render();
  };
  aks.belirti = function (el) {
    var g = Depo.gun(A.bugun()), b = el.dataset.v, i = g.belirti.indexOf(b);
    if (i >= 0) g.belirti.splice(i, 1); else g.belirti.push(b);
    el.classList.toggle('secili', i < 0);
    A.kaydet();
  };
})();
