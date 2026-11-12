// Egzersiz ve adım: yakılan kalori = MET × kilo × saat
(function () {
  'use strict';
  var A = App, V = A.V, esc = A.esc, sayi = A.sayi, $ = A.$;

  var SPORLAR = [
    ['Yürüyüş (normal)', 3.5, '🚶'], ['Tempolu yürüyüş', 4.3, '🚶'], ['Doğa yürüyüşü', 6, '🥾'],
    ['Koşu (yavaş, 8 km/s)', 8.3, '🏃'], ['Koşu (10 km/s)', 9.8, '🏃'], ['Koşu bandı', 8, '🏃'],
    ['Bisiklet (orta)', 6.8, '🚴'], ['Sabit bisiklet', 6.8, '🚴'], ['Eliptik', 5, '🏋️'],
    ['Fitness / ağırlık', 5, '🏋️'], ['HIIT / interval', 8, '🔥'], ['İp atlama', 11, '🪢'],
    ['Merdiven çıkma', 8, '🪜'], ['Yüzme', 7, '🏊'], ['Pilates', 3, '🧘'], ['Yoga', 2.5, '🧘'],
    ['Dans / zumba', 5, '💃'], ['Futbol', 7, '⚽'], ['Basketbol', 6.5, '🏀'], ['Voleybol', 4, '🏐'],
    ['Tenis', 7.3, '🎾'], ['Masa tenisi', 4, '🏓'], ['Kürek çekme', 7, '🚣'], ['Ev işi', 3, '🧹'], ['Bahçe işi', 4, '🌱']
  ];

  function kcal(met, dk) { return Math.round(met * V().profil.kilo * dk / 60); }
  function adimKcal(adim) { return Math.round(adim * V().profil.kilo * 0.0005); }

  A.sheetler.egzersiz = function (s) {
    var h = A.basHtml('Egzersiz ekle', 'kapat') + '<div class="sheet-govde">';
    h += '<div class="sekme-sec"><button class="' + (s.mod === 'spor' ? 'secili' : '') + '" data-a="egzMod" data-v="spor">Spor</button>' +
      '<button class="' + (s.mod === 'adim' ? 'secili' : '') + '" data-a="egzMod" data-v="adim">Adım</button>' +
      '<button class="' + (s.mod === 'elle' ? 'secili' : '') + '" data-a="egzMod" data-v="elle">Elle</button></div>';
    if (s.mod === 'spor') {
      h += '<div class="form-alan" style="margin-top:14px"><label for="egzDk">Süre (dakika)</label><input id="egzDk" type="text" inputmode="numeric" value="' + esc(s.dk) + '"></div>';
      h += '<div class="liste">';
      SPORLAR.forEach(function (x, i) {
        h += '<div class="yemek-satir"><button class="ad" data-a="egzSpor" data-v="' + i + '"><b>' + x[2] + ' ' + esc(x[0]) + '</b><span id="egzK' + i + '">' + sayi(kcal(x[1], A.oku(s.dk) || 0)) + ' kcal</span></button>' +
          '<button class="mini-arti" data-a="egzSpor" data-v="' + i + '" aria-label="Ekle">' + A.ik('arti') + '</button></div>';
      });
      h += '</div>';
    } else if (s.mod === 'adim') {
      h += '<p class="ipucu" style="margin-top:14px">iPhone\'un Sağlık uygulamasındaki bugünkü adım sayını buraya yaz. (Web uygulamaları Sağlık verisini kendisi okuyamıyor.)</p>' +
        '<div class="form-alan"><label for="egzAdim">Adım sayısı</label><input id="egzAdim" type="text" inputmode="numeric" placeholder="ör. 8000"></div>' +
        '<p class="ipucu" id="egzAdimK"></p><button class="dugme" data-a="egzAdimKaydet">Ekle</button>';
    } else {
      h += '<div class="form-alan" style="margin-top:14px"><label for="egzAd">Ne yaptın?</label><input id="egzAd" type="text" placeholder="ör. Akıllı saatteki antrenman"></div>' +
        '<div class="form-alan"><label for="egzKcal">Yakılan kalori</label><input id="egzKcal" type="text" inputmode="numeric" placeholder="ör. 300"></div>' +
        '<button class="dugme" data-a="egzElleKaydet">Ekle</button>';
    }
    return h + '</div>';
  };

  A.kisa.egzersizDuzen = 1;
  A.sheetler.egzersizDuzen = function (s) {
    var e = s.e;
    return A.basHtml(e.ad, 'kapat') + '<div class="sheet-govde"><p class="ipucu">' + esc(e.aciklama || '') + '</p>' +
      '<div class="detay-kcal"><b>' + sayi(e.k) + '</b><span>kcal yakıldı</span></div>' +
      '<button class="dugme tehlike" data-a="egzSil">' + A.ik('cop') + 'Sil</button></div>';
  };

  function ekle(e) {
    e.id = Depo.yeniId();
    Depo.gun(A.S.tarih).egzersiz.push(e);
    A.kaydet(); A.render(); A.sheetKapat();
    A.toast(e.ad + ': ' + e.k + ' kcal eklendi');
  }

  var aks = A.aks;
  aks.egzersizEkle = function () { A.S.sheet = { tur: 'egzersiz', mod: 'spor', dk: '30' }; A.sheetAc(); };
  aks.egzMod = function (el) { A.S.sheet.mod = el.dataset.v; A.renderSheet(); };
  aks.egzSpor = function (el) {
    var x = SPORLAR[Number(el.dataset.v)], dk = A.oku(A.S.sheet.dk);
    if (!(dk > 0)) { A.toast('Süreyi yaz'); return; }
    ekle({ ad: x[0], aciklama: Math.round(dk) + ' dakika', k: kcal(x[1], dk) });
  };
  aks.egzAdimKaydet = function () {
    var n = A.oku($('egzAdim').value);
    if (!(n > 0)) { A.toast('Adım sayısını yaz'); return; }
    var g = Depo.gun(A.S.tarih);
    g.egzersiz = g.egzersiz.filter(function (e) { return e.tur !== 'adim'; }); // günde tek adım kaydı
    ekle({ ad: 'Adım', tur: 'adim', aciklama: sayi(n) + ' adım', k: adimKcal(n) });
  };
  aks.egzElleKaydet = function () {
    var ad = $('egzAd').value.trim() || 'Egzersiz', k = A.oku($('egzKcal').value);
    if (!(k > 0)) { A.toast('Kaloriyi yaz'); return; }
    ekle({ ad: ad, aciklama: 'elle girildi', k: Math.round(k) });
  };
  aks.egzersizAc = function (el) {
    var e = Depo.gunOku(A.S.tarih).egzersiz.filter(function (x) { return x.id === el.dataset.v; })[0];
    if (e) { A.S.sheet = { tur: 'egzersizDuzen', e: e }; A.sheetAc(); }
  };
  aks.egzSil = function () {
    var id = A.S.sheet.e.id, g = Depo.gun(A.S.tarih);
    g.egzersiz = g.egzersiz.filter(function (x) { return x.id !== id; });
    A.kaydet(); A.render(); A.sheetKapat(); A.toast('Silindi');
  };

  A.giris.egzDk = function (el) {
    A.S.sheet.dk = el.value;
    var dk = A.oku(el.value) || 0;
    SPORLAR.forEach(function (x, i) { var t = $('egzK' + i); if (t) t.textContent = sayi(kcal(x[1], dk)) + ' kcal'; });
  };
  A.giris.egzAdim = function (el) {
    var n = A.oku(el.value);
    $('egzAdimK').textContent = n > 0 ? '≈ ' + sayi(adimKcal(n)) + ' kcal' : '';
  };
})();
