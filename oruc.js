// Aralıklı oruç: saatlik planlar (16:8 vb.) için sayaç, haftalık planlar (5:2, 6:1) için oruç günleri.
(function () {
  'use strict';
  var A = App, V = A.V, esc = A.esc, sayi = A.sayi, $ = A.$;

  var PLANLAR = [
    { id: '12:12', saat: 12, acik: 'Başlangıç için ideal' },
    { id: '14:10', saat: 14, acik: 'Kolay' },
    { id: '16:8', saat: 16, acik: 'En popüler' },
    { id: '18:6', saat: 18, acik: 'İleri' },
    { id: '20:4', saat: 20, acik: 'Zor' },
    { id: '23:1', saat: 23, acik: 'Günde tek öğün' },
    { id: '5:2', hafta: 2, acik: 'Haftada 2 gün 500-600 kcal' },
    { id: '6:1', hafta: 1, acik: 'Haftada 1 gün 500-600 kcal' }
  ];
  var EVRELER = [
    [0, '🍽️', 'Sindirim', 'Vücut son öğünü sindiriyor, kan şekeri yükseliyor.'],
    [4, '📉', 'Kan şekeri düşüyor', 'İnsülin azalıyor, vücut depolarını kullanmaya hazırlanıyor.'],
    [8, '🔄', 'Geçiş', 'Karaciğerdeki şeker depoları azalıyor.'],
    [12, '🔥', 'Yağ yakımı', 'Vücut enerji için daha çok yağ kullanmaya başlıyor.'],
    [16, '⚡', 'Ketozis başlangıcı', 'Yağ yakımı artıyor, keton seviyesi yükseliyor.'],
    [24, '♻️', 'Otofaji', 'Hücre yenilenme süreçlerinin arttığı düşünülüyor.']
  ];
  var GUN_KISA = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  function plan() { var o = V().oruc; return PLANLAR.filter(function (p) { return p.id === o.plan; })[0] || PLANLAR[2]; }
  function sure(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sn = s % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (sn < 10 ? '0' : '') + sn;
  }
  function saatYazi(t) { var d = new Date(t); return d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); }
  function gunSaat(t) {
    var d = new Date(t), b = new Date();
    var gun = d.toDateString() === b.toDateString() ? 'Bugün' : (new Date(b.getTime() - 864e5).toDateString() === d.toDateString() ? 'Dün' : (new Date(b.getTime() + 864e5).toDateString() === d.toDateString() ? 'Yarın' : d.getDate() + ' ' + A.AYLAR[d.getMonth()]));
    return gun + ' ' + saatYazi(t);
  }

  A.sekmeHtml.oruc = function () {
    var o = V().oruc, p = plan(), h = '';
    if (p.hafta) {
      h += '<section class="kart"><h3 class="kart-bas">' + p.id + ' planı</h3><p class="ipucu">' + esc(p.acik) + '. Oruç günlerinde Günlük ekranındaki hedefin kendiliğinden ' + (V().profil.cinsiyet === 'erkek' ? 600 : 500) + ' kcal olur. Hangi günler?</p><div class="gun-sec">';
      for (var i = 1; i <= 7; i++) {
        var g = i % 7;
        h += '<button class="' + (o.haftaGunleri.indexOf(g) >= 0 ? 'secili' : '') + '" data-a="orucGun" data-v="' + g + '">' + GUN_KISA[g] + '</button>';
      }
      h += '</div><p class="ipucu" style="margin-top:10px">' + o.haftaGunleri.length + ' / ' + p.hafta + ' gün seçildi</p></section>';
    } else {
      var simdi = Date.now(), hedefMs = p.saat * 3600e3;
      if (o.basla) {
        var gecen = simdi - o.basla, kalan = hedefMs - gecen;
        h += '<section class="kart oruc-kart">' +
          A.halkaHtml(gecen / hedefMs, '<span id="orucSaat">' + (kalan > 0 ? sure(kalan) : '+' + sure(-kalan)) + '</span>', '<span id="orucAlt">' + (kalan > 0 ? 'kaldı' : 'hedef tamam! 🎉') + '</span>', false, 220) +
          '<div class="oruc-zaman"><div><span>Başladı</span><b>' + gunSaat(o.basla) + '</b></div><div><span>Hedef</span><b>' + gunSaat(o.basla + hedefMs) + '</b></div></div>' +
          '<button class="dugme" data-a="orucBitir">Orucu bitir</button>' +
          '<button class="dugme ikincil" data-a="orucBasDuzen" style="margin-top:8px">Başlangıç saatini değiştir</button></section>';
        var saat = gecen / 3600e3;
        h += '<div class="bolum-bas">Evreler (genel bilgi)</div><section class="kart evreler">';
        EVRELER.forEach(function (e, i) {
          var aktif = saat >= e[0] && (i === EVRELER.length - 1 || saat < EVRELER[i + 1][0]);
          h += '<div class="evre' + (aktif ? ' aktif' : '') + (saat >= e[0] ? ' gecti' : '') + '"><span class="em">' + e[1] + '</span><div><b>' + e[0] + '+ saat · ' + e[2] + '</b><span>' + e[3] + '</span></div></div>';
        });
        h += '</section>';
      } else {
        h += '<section class="kart oruc-kart">' + A.halkaHtml(0, p.id, 'plan', false, 220) +
          '<p class="ipucu" style="text-align:center">Son öğününü bitirdiğinde başlat. ' + p.saat + ' saat sonra yeme pencere açılır.</p>' +
          '<button class="dugme" data-a="orucBasla">Orucu başlat</button></section>';
      }
    }

    h += '<div class="bolum-bas">Plan</div><div class="plan-izgara">';
    PLANLAR.forEach(function (x) {
      h += '<button class="plan' + (x.id === o.plan ? ' secili' : '') + '" data-a="orucPlan" data-v="' + x.id + '"><b>' + x.id + '</b><span>' + esc(x.acik) + '</span></button>';
    });
    h += '</div>';

    var gec = (o.gecmis || []).slice(-10).reverse();
    if (gec.length) {
      h += '<div class="bolum-bas">Son oruçlar · seri ' + seri() + ' gün</div><section class="kart" style="padding-top:4px;padding-bottom:4px">';
      gec.forEach(function (g) {
        var saat = (g.bitis - g.basla) / 3600e3, ok = saat >= g.hedef;
        h += '<div class="kayit"><span class="ad"><b>' + (ok ? '✅ ' : '◻️ ') + sayi(saat, true) + ' saat</b><span>' + gunSaat(g.basla) + ' → ' + saatYazi(g.bitis) + ' · hedef ' + g.hedef + ' sa</span></span></div>';
      });
      h += '</section>';
    }
    h += '<p class="ipucu" style="text-align:center;margin:14px 0">Uygulama kapalıyken bildirim gönderemez; sayaç uygulamayı açınca güncellenir. Hamilelik, diyabet gibi durumlarda oruçtan önce doktoruna danış.</p>';
    return h;
  };

  // Başarılı oruçların gün serisi
  function seri() {
    var g = (V().oruc.gecmis || []).filter(function (x) { return (x.bitis - x.basla) / 3600e3 >= x.hedef; });
    var gunler = {};
    g.forEach(function (x) { gunler[Hesap.tarihAnahtar(new Date(x.bitis))] = 1; });
    var n = 0, k = A.bugun();
    if (!gunler[k]) k = A.kaydir(k, -1);
    while (gunler[k]) { n++; k = A.kaydir(k, -1); }
    return n;
  }
  window.OrucSeri = seri;

  var zamanlayici = null;
  A.sekmeSonra.oruc = function () {
    clearInterval(zamanlayici);
    var o = V().oruc, p = plan();
    if (!o.basla || p.hafta) return;
    var hedefMs = p.saat * 3600e3, bitti = Date.now() - o.basla >= hedefMs;
    zamanlayici = setInterval(function () {
      if (A.S.sekme !== 'oruc' || !V().oruc.basla) { clearInterval(zamanlayici); return; }
      var gecen = Date.now() - o.basla, kalan = hedefMs - gecen;
      if (!bitti && kalan <= 0) { bitti = true; A.render(); return; }
      var el = $('orucSaat'); if (el) el.textContent = kalan > 0 ? sure(kalan) : '+' + sure(-kalan);
      var c = document.querySelector('.oruc-kart .dolu');
      if (c) { var C = 2 * Math.PI * 60; c.setAttribute('stroke-dashoffset', (C * (1 - Math.min(1, gecen / hedefMs))).toFixed(1)); }
    }, 1000);
  };

  A.kisa.orucZaman = 1;
  A.sheetler.orucZaman = function () {
    var d = new Date(V().oruc.basla), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var deger = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    return A.basHtml('Başlangıç saati', 'kapat') + '<div class="sheet-govde"><p class="ipucu">Orucu başlatmayı unuttuysan son öğününü bitirdiğin zamanı seç.</p>' +
      '<div class="form-alan"><input id="orucBasZaman" type="datetime-local" value="' + deger + '"></div>' +
      '<button class="dugme" data-a="orucBasKaydet">Kaydet</button></div>';
  };

  var aks = A.aks;
  aks.orucPlan = function (el) {
    var o = V().oruc;
    if (o.basla && !confirm('Devam eden oruç var. Plan değişince sayaç sıfırlanmaz, yalnızca hedef süre değişir. Devam edilsin mi?')) return;
    o.plan = el.dataset.v;
    var p = plan();
    if (p.hafta && o.haftaGunleri.length > p.hafta) o.haftaGunleri = o.haftaGunleri.slice(0, p.hafta);
    A.kaydet(); A.render();
  };
  aks.orucGun = function (el) {
    var o = V().oruc, g = Number(el.dataset.v), p = plan();
    var i = o.haftaGunleri.indexOf(g);
    if (i >= 0) o.haftaGunleri.splice(i, 1);
    else {
      if (o.haftaGunleri.length >= p.hafta) o.haftaGunleri.shift();
      o.haftaGunleri.push(g);
    }
    A.kaydet(); A.render();
  };
  aks.orucBasla = function () { V().oruc.basla = Date.now(); A.kaydet(); A.render(); A.toast('Oruç başladı. Kolay gelsin! 💪'); };
  aks.orucBitir = function () {
    var o = V().oruc, p = plan(), saat = (Date.now() - o.basla) / 3600e3;
    if (saat < p.saat && !confirm('Hedefe ' + sayi(p.saat - saat, true) + ' saat var. Yine de bitirilsin mi?')) return;
    o.gecmis = (o.gecmis || []).concat([{ basla: o.basla, bitis: Date.now(), hedef: p.saat }]).slice(-200);
    o.basla = null;
    A.kaydet(); A.render();
    A.toast(saat >= p.saat ? 'Tebrikler! ' + sayi(saat, true) + ' saat oruç tuttun 🎉' : sayi(saat, true) + ' saat oruç kaydedildi');
  };
  aks.orucBasDuzen = function () { A.S.sheet = { tur: 'orucZaman' }; A.sheetAc(); };
  aks.orucBasKaydet = function () {
    var v = $('orucBasZaman').value, t = v ? new Date(v).getTime() : NaN;
    if (isNaN(t) || t > Date.now()) { A.toast('Geçerli, geçmiş bir zaman seç'); return; }
    V().oruc.basla = t; A.kaydet(); A.sheetKapat(); A.render();
  };
})();
